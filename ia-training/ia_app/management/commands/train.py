import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from sklearn.model_selection import train_test_split
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Entrena modelo RNN con dataset aumentado'

    def add_arguments(self, parser):
        parser.add_argument('--data', type=str, required=True, help='Archivo CSV con datos')
        parser.add_argument('--output', type=str, required=True, help='Ruta del modelo .h5')
        parser.add_argument('--seq-length', type=int, default=30, help='Frames por secuencia')
        parser.add_argument('--epochs', type=int, default=50, help='Número de épocas')

    def handle(self, *args, **options):
        data_path = options['data']
        output_path = options['output']
        seq_length = options['seq_length']
        epochs = options['epochs']
        
        self.stdout.write(f'📊 Cargando datos: {data_path}')
        
        df = pd.read_csv(data_path)
        X = df.drop('label', axis=1).values
        y = df['label'].values
        
        # Calcular features por frame (126 = 63+63)
        n_features = 126
        n_samples = len(X) // seq_length
        X = X[:n_samples * seq_length].reshape(n_samples, seq_length, n_features)
        y = y[:n_samples * seq_length:seq_length]
        
        self.stdout.write(f'   Muestras: {n_samples}, Features: {n_features}')
        
        # Dividir datos
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.stdout.write(f'   Entrenamiento: {len(X_train)} muestras')
        self.stdout.write(f'   Validación: {len(X_val)} muestras')
        
        # Construir modelo
        model = Sequential([
            LSTM(128, return_sequences=True, input_shape=(seq_length, n_features)),
            Dropout(0.2),
            LSTM(64, return_sequences=False),
            Dropout(0.2),
            Dense(32, activation='relu'),
            Dense(1, activation='sigmoid')
        ])
        
        model.compile(optimizer=Adam(learning_rate=0.001),
                      loss='binary_crossentropy',
                      metrics=['accuracy'])
        
        model.summary()
        
        self.stdout.write(f'🚀 Entrenando modelo...')
        
        history = model.fit(X_train, y_train,
                            validation_data=(X_val, y_val),
                            epochs=epochs,
                            batch_size=32,
                            verbose=1)
        
        model.save(output_path)
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Modelo guardado en: {output_path}'))
        self.stdout.write(f'   Precisión final: {history.history["accuracy"][-1]:.4f}')
        self.stdout.write(f'   Precisión validación: {history.history["val_accuracy"][-1]:.4f}')