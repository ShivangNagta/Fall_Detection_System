from flask import Flask, request, jsonify
import tensorflow as tf
import logging
from flask_cors import CORS
import numpy as np
import os

app = Flask(__name__)

CORS(app) 

logging.basicConfig(level=logging.INFO)

MODEL_PATH = './models/trained/try1/fall_detection_model.keras'

try:
    if os.path.exists(MODEL_PATH):
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"Model loaded successfully from: {MODEL_PATH}")
    else:
        raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")
    raise

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

    with open(file_path, 'r') as file:
        for line in file:
            cleaned_line = line.strip().rstrip(';').split(',')
            if len(cleaned_line) >= 9:
                row_data = [float(val) for val in cleaned_line[3:9]]
                data_rows.append(row_data)

    data = np.array(data_rows)
    sequences = []
    for i in range(len(data) - sequence_length + 1):
        sequences.append(data[i:i+sequence_length])

    if len(sequences) == 0:
        sequences.append(np.zeros((sequence_length, 6)))

    return np.array(sequences)


@app.route('/')
def index():
    return "Fall detection service is up and running!"


@app.route('/predict', methods=['POST'])
def predict():
    data_rec = request.json.get('data')

    data = np.array(data_rec)

    sequences = []
    for i in range(len(data) - 200 + 1):
        sequences.append(data[i:i+200])

    if len(sequences) == 0:
        sequences.append(np.zeros((200, 6))) 

    data = np.array(sequences)

    tensor_data = tf.convert_to_tensor(data)
    print(tensor_data.shape)

    try:
        prediction = model.predict(tensor_data)
        fall_probabilities = prediction[:, 1]
        if np.mean(fall_probabilities) > 0.5:
            return jsonify({'fallDetected': True})
        else:
            return jsonify({'fallDetected': False})
    
    except Exception as e:
        app.logger.error(f"Error during prediction: {e}")
        return jsonify({'error': 'Internal server error during prediction'}), 500

if __name__ == '__main__':
    app.run(port=5000)