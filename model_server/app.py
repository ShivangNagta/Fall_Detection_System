from flask import Flask, request, jsonify
import tensorflow as tf
import logging
from flask_cors import CORS
import numpy as np

app = Flask(__name__)

CORS(app) 

# Set up logging for debugging
logging.basicConfig(level=logging.INFO)

# Load the Keras model
model = tf.keras.models.load_model('./fall_detection_model.keras')




def preprocess_single_file(file_path, sequence_length=200):
    """
    Preprocess a single text file for prediction.
    Uses a sliding window approach to capture multiple sequences of the given length.
    
    Parameters:
    file_path (str): Path to the text file containing sensor data.
    sequence_length (int): Length of input sequences.
    
    Returns:
    numpy.ndarray: Preprocessed input data ready for prediction (a batch of sequences).
    """
    data_rows = []

    # Read file and parse rows
    with open(file_path, 'r') as file:
        for line in file:
            cleaned_line = line.strip().rstrip(';').split(',')
            if len(cleaned_line) >= 9:  # Ensure there are at least 9 columns
                row_data = [float(val) for val in cleaned_line[3:9]]  # Use columns 4-9 (gyro + accel data)
                data_rows.append(row_data)

    # Convert the data into a numpy array
    data = np.array(data_rows)

    # For sequences longer than the fixed length, use a sliding window approach
    sequences = []
    for i in range(len(data) - sequence_length + 1):
        sequences.append(data[i:i+sequence_length])

    # If there are no sequences (i.e., the data is smaller than sequence_length), pad with zeros
    if len(sequences) == 0:
        sequences.append(np.zeros((sequence_length, 6)))  # Padding with zeros

    # Convert to a numpy array and return
    return np.array(sequences)







@app.route('/predict', methods=['POST'])
def predict():
    data_rec = request.json.get('data')

    data = np.array(data_rec)

    # For sequences longer than the fixed length, use a sliding window approach
    sequences = []
    for i in range(len(data) - 200 + 1):
        sequences.append(data[i:i+200])

    # If there are no sequences (i.e., the data is smaller than sequence_length), pad with zeros
    if len(sequences) == 0:
        sequences.append(np.zeros((200, 6)))  # Padding with zeros

    # Convert to a numpy array and return


    data = np.array(sequences)
    
    # # Validate input data format
    # if not data or not isinstance(data, list):
    #     return jsonify({'error': 'Invalid input data'}), 400
    
    # # Check if each row has 6 elements
    # if not all(len(row) == 6 for row in data):
    #     return jsonify({'error': 'Each data row must have 6 elements'}), 400

    # Convert the data into a TensorFlow tensor
    tensor_data = tf.convert_to_tensor(data)
    print(tensor_data.shape)

    try:
        # Make the prediction
        prediction = model.predict(tensor_data)
        fall_probabilities = prediction[:, 1]  # Probability of "Fall" class (assuming the second output is fall)
        if np.mean(fall_probabilities) > 0.5:
            return jsonify({'fallDetected': True})
        else:
            return jsonify({'fallDetected': False})
    
    except Exception as e:
        # Catch any errors during prediction
        app.logger.error(f"Error during prediction: {e}")
        return jsonify({'error': 'Internal server error during prediction'}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
