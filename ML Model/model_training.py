import os
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization, Bidirectional
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.regularizers import l2
import joblib
import matplotlib.pyplot as plt

# Set random seed for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

def load_data(dataset_path, window_size=1000, step_size=100):
    """
    Load data and split into sliding windows with a sampling rate of 200 Hz.
    """
    X = []
    y = []
    fall_codes = [f'F{str(i).zfill(2)}' for i in range(1, 16)]
    adl_codes = [f'D{str(i).zfill(2)}' for i in range(1, 20)]

    for subject_folder in os.listdir(dataset_path):
        subject_path = os.path.join(dataset_path, subject_folder)
        if not os.path.isdir(subject_path):
            continue
        
        for filename in os.listdir(subject_path):
            if not filename.endswith('.txt'):
                continue

            file_prefix = filename.split('_')[0]
            if file_prefix in fall_codes:
                label = 1
            elif file_prefix in adl_codes:
                label = 0
            else:
                continue

            file_path = os.path.join(subject_path, filename)
            try:
                with open(file_path, 'r') as f:
                    data_rows = []
                    for line in f:
                        cleaned_line = line.strip().rstrip(';').split(',')
                        if len(cleaned_line) >= 9:
                            row_data = [float(val) for val in cleaned_line[3:9]]
                            data_rows.append(row_data)
                
                data = np.array(data_rows)
                
                # Apply sliding window
                for start in range(0, len(data) - window_size + 1, step_size):
                    window = data[start:start + window_size]
                    if window.shape[0] == window_size: 
                        X.append(window)
                        y.append(label)
            except Exception as e:
                print(f"Error reading {filename}: {e}")
    
    return X, y

def preprocess_data_in_batches(X, y, batch_size=10000, test_size=0.2):
    """
    Preprocess data by scaling and splitting into train and test sets in batches.
    """
    X = np.array(X, dtype=np.float32)
    y = np.array(y)
    y_categorical = to_categorical(y)

    # Split into train and test sets before scaling
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_categorical, test_size=test_size, random_state=42, stratify=y
    )

    # Standardize data in batches
    scaler = StandardScaler()
    X_train_scaled = []
    for i in range(0, len(X_train), batch_size):
        X_batch = X_train[i:i + batch_size]
        X_batch_scaled = scaler.partial_fit(X_batch.reshape(-1, X_batch.shape[-1])).transform(
            X_batch.reshape(-1, X_batch.shape[-1])
        ).reshape(X_batch.shape)
        X_train_scaled.append(X_batch_scaled)

    X_test_scaled = []
    for i in range(0, len(X_test), batch_size):
        X_batch = X_test[i:i + batch_size]
        X_batch_scaled = scaler.transform(X_batch.reshape(-1, X_batch.shape[-1])).reshape(X_batch.shape)
        X_test_scaled.append(X_batch_scaled)

    # Concatenate batches
    X_train_scaled = np.concatenate(X_train_scaled)
    X_test_scaled = np.concatenate(X_test_scaled)

    # Save scaler for deployment
    joblib.dump(scaler, 'scaler.pkl')

    # Save training mean and std for deployment or hardcoding on ESP32
    np.save('training_mean.npy', scaler.mean_)
    np.save('training_std.npy', scaler.scale_)

    return X_train_scaled, X_test_scaled, y_train, y_test

def create_lstm_model(input_shape, num_classes=2):
    """
    Create an LSTM model optimized for sequence data.
    """
    model = Sequential([
        Bidirectional(LSTM(64, return_sequences=True, kernel_regularizer=l2(0.001),
                           recurrent_regularizer=l2(0.001)), input_shape=input_shape),
        BatchNormalization(),
        Dropout(0.4),
        Bidirectional(LSTM(32, kernel_regularizer=l2(0.001),
                           recurrent_regularizer=l2(0.001))),
        BatchNormalization(),
        Dropout(0.4),
        Dense(64, activation='relu', kernel_regularizer=l2(0.001)),
        BatchNormalization(),
        Dropout(0.3),
        Dense(32, activation='relu', kernel_regularizer=l2(0.001)),
        BatchNormalization(),
        Dropout(0.3),
        Dense(num_classes, activation='softmax')
    ])
    
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.0005)
    
    model.compile(optimizer=optimizer, loss='categorical_crossentropy',
                  metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()])
    
    return model

def plot_metrics(history):
    """
    Plot accuracy and loss metrics.
    """
    plt.figure(figsize=(12, 6))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()

    plt.tight_layout()
    plt.show()

def main():
    dataset_path = './SisFall_dataset'
    
    print("Loading data...")
    X, y = load_data(dataset_path)
    
    unique, counts = np.unique(y, return_counts=True)
    print("\nClass Distribution:")
    print(dict(zip(unique, counts)))
    
    print("\nPreprocessing data...")
    X_train, X_test, y_train, y_test = preprocess_data_in_batches(X, y, batch_size=10000, test_size=0.2)
    
    input_shape = (X_train.shape[1], X_train.shape[2])
    
    print("\nCreating LSTM model...")
    model = create_lstm_model(input_shape)
    model.summary()
    
    early_stopping = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=5, min_lr=0.00001)
    
    class_weights = {0: 1.0, 1: counts[0] / counts[1]}
    
    print("\nTraining model...")
    history = model.fit(X_train, y_train, validation_split=0.2, epochs=120, batch_size=32,
                        callbacks=[early_stopping, reduce_lr], class_weight=class_weights, verbose=1)
    
    print("\nModel Evaluation:")
    test_loss, test_accuracy, precision, recall = model.evaluate(X_test, y_test)
    print(f"Test Accuracy: {test_accuracy*100:.2f}%")
    print(f"Test Loss: {test_loss:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    
    from sklearn.metrics import confusion_matrix, classification_report
    y_pred = model.predict(X_test)
    y_pred_classes = np.argmax(y_pred, axis=1)
    y_true_classes = np.argmax(y_test, axis=1)
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_true_classes, y_pred_classes))
    
    print("\nClassification Report:")
    print(classification_report(y_true_classes, y_pred_classes, target_names=['Not Fall', 'Fall']))
    
    model.save('fall_detection_model.keras')
    print("\nModel saved as fall_detection_model.keras")
    
    plot_metrics(history)

main()