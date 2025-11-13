import numpy as np
import pandas as pd
import json
import pickle
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.model_selection import train_test_split
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
import os
 
class PropertyPriceLSTM:
    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler()
        self.mandal_encoder = LabelEncoder()
        self.village_encoder = LabelEncoder()
        self.sequence_length = 10
 
    def load_data(self, json_path):
        """Load Tirupati dataset from JSON file"""
        print("Loading dataset...")
        with open(json_path, 'r') as f:
            data = json.load(f)
 
        df = pd.DataFrame(data['data'])
        print(f"Loaded {len(df)} records")
 
        # Clean and prepare data
        df = df[df['UNIT_RATE'] > 0].copy()  # Remove invalid rates
        df['EFFECTIVE_DATE'] = pd.to_datetime(df['EFFECTIVE_DATE'])
 
        # Sort by date for time series
        df = df.sort_values('EFFECTIVE_DATE')
 
        print(f"After cleaning: {len(df)} records")
        return df
 
    def prepare_features(self, df):
        """Prepare features for LSTM model"""
        print("Preparing features...")
 
        # Encode categorical features
        df['MANDAL_ENCODED'] = self.mandal_encoder.fit_transform(df['MANDAL'])
        df['VILLAGE_ENCODED'] = self.village_encoder.fit_transform(df['VILLAGE'])
 
        # Extract features
        features = df[[
            'MANDAL_ENCODED',
            'VILLAGE_ENCODED',
            'WARD_NO',
            'BLOCK_NO',
            'DOOR_NO',
            'COMM_RATE',
            'COMP_FLOOR1',
            'COMP_FLOOR_OTH',
            'PRE_REV_UNIT_RATE'
        ]].values
 
        # Target variable
        target = df['UNIT_RATE'].values
 
        return features, target
 
    def create_sequences(self, features, target):
        """Create time series sequences for LSTM"""
        print(f"Creating sequences with length {self.sequence_length}...")
 
        X, y = [], []
        for i in range(len(features) - self.sequence_length):
            X.append(features[i:i + self.sequence_length])
            y.append(target[i + self.sequence_length])
 
        X = np.array(X)
        y = np.array(y)
 
        print(f"Created {len(X)} sequences")
        return X, y
 
    def build_model(self, input_shape):
        """Build LSTM model architecture"""
        print("Building LSTM model...")
 
        model = Sequential([
            LSTM(128, activation='relu', return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(64, activation='relu', return_sequences=True),
            Dropout(0.2),
            LSTM(32, activation='relu'),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1)
        ])
 
        model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
 
        print(model.summary())
        return model
 
    def train(self, json_path, epochs=50, batch_size=32):
        """Train the LSTM model"""
        # Load and prepare data
        df = self.load_data(json_path)
        features, target = self.prepare_features(df)
 
        # Normalize features
        features_scaled = self.scaler.fit_transform(features)
 
        # Create sequences
        X, y = self.create_sequences(features_scaled, target)
 
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
 
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
 
        # Build model
        self.model = self.build_model((X_train.shape[1], X_train.shape[2]))
 
        # Early stopping
        early_stop = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
 
        # Train
        print("\nTraining model...")
        history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            callbacks=[early_stop],
            verbose=1
        )
 
        # Evaluate
        print("\nEvaluating model...")
        test_loss, test_mae = self.model.evaluate(X_test, y_test)
        print(f"Test Loss: {test_loss:.2f}")
        print(f"Test MAE: {test_mae:.2f}")
 
        return history
 
    def predict(self, mandal, village, ward_no, block_no, door_no, comm_rate,
                comp_floor1, comp_floor_oth, prev_rate):
        """Predict property price"""
        if self.model is None:
            raise Exception("Model not trained or loaded")
 
        # Encode categorical features
        try:
            mandal_encoded = self.mandal_encoder.transform([mandal])[0]
        except:
            mandal_encoded = 0  # Default for unknown mandal
 
        try:
            village_encoded = self.village_encoder.transform([village])[0]
        except:
            village_encoded = 0  # Default for unknown village
 
        # Prepare input features
        features = np.array([[
            mandal_encoded,
            village_encoded,
            ward_no,
            block_no,
            door_no,
            comm_rate,
            comp_floor1,
            comp_floor_oth,
            prev_rate
        ]])
 
        # Scale features
        features_scaled = self.scaler.transform(features)
 
        # Create sequence (repeat for sequence length)
        sequence = np.array([features_scaled] * self.sequence_length)
        sequence = sequence.reshape(1, self.sequence_length, features.shape[1])
 
        # Predict
        prediction = self.model.predict(sequence, verbose=0)[0][0]
 
        return float(prediction)
 
    def save_model(self, model_dir='ml-model/saved_models'):
        """Save trained model and encoders"""
        os.makedirs(model_dir, exist_ok=True)
 
        print(f"Saving model to {model_dir}...")
        self.model.save(f'{model_dir}/lstm_model.h5')
 
        # Save scaler and encoders
        with open(f'{model_dir}/scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)
        with open(f'{model_dir}/mandal_encoder.pkl', 'wb') as f:
            pickle.dump(self.mandal_encoder, f)
        with open(f'{model_dir}/village_encoder.pkl', 'wb') as f:
            pickle.dump(self.village_encoder, f)
 
        print("Model saved successfully!")
 
    def load_model(self, model_dir='ml-model/saved_models'):
        """Load trained model and encoders"""
        print(f"Loading model from {model_dir}...")
 
        self.model = keras.models.load_model(f'{model_dir}/lstm_model.h5')
 
        with open(f'{model_dir}/scaler.pkl', 'rb') as f:
            self.scaler = pickle.load(f)
        with open(f'{model_dir}/mandal_encoder.pkl', 'rb') as f:
            self.mandal_encoder = pickle.load(f)
        with open(f'{model_dir}/village_encoder.pkl', 'rb') as f:
            self.village_encoder = pickle.load(f)
 
        print("Model loaded successfully!")
 
if __name__ == '__main__':
    # Train the model
    lstm_model = PropertyPriceLSTM()
 
    # Path to dataset
    dataset_path = '../src/data/tirupatidataset_with_location.json'
 
    # Train
    history = lstm_model.train(dataset_path, epochs=50, batch_size=64)
 
    # Save model
    lstm_model.save_model()
 
    print("\n✅ Model training complete!")