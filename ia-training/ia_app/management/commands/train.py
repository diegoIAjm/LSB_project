# ia_app/management/commands/train.py
import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from django.core.management.base import BaseCommand
import joblib
import os
import json
import sys

# Importar comandos
from .extract import Command as ExtractCommand
from .augment import Command as AugmentCommand


class Command(BaseCommand):
    help = 'Entrena modelo RNN para una seña especifica'

    def add_arguments(self, parser):
        parser.add_argument('--video', type=str, required=True)
        parser.add_argument('--output', type=str, required=True)
        parser.add_argument('--nombre', type=str, required=True)
        parser.add_argument('--epochs', type=int, default=30)
        parser.add_argument('--seq-length', type=int, default=30, help='Longitud de secuencia para LSTM')
        parser.add_argument('--num-sena', type=int, default=200, help='Numero de variaciones para la seña')
        parser.add_argument('--num-silencio', type=int, default=200, help='Numero de variaciones para silencio')

    def handle(self, *args, **options):
        video_path = options['video']
        output_path = options['output']
        nombre_sena = options['nombre']
        epochs = options['epochs']
        seq_length = options['seq_length']
        num_sena = options['num_sena']
        num_silencio = options['num_silencio']

        self.stdout.write(f'Procesando video para seña: {nombre_sena}')
        self.stdout.write(f'Longitud de secuencia: {seq_length}')
        self.stdout.write(f'Muestras de seña: {num_sena}')
        self.stdout.write(f'Muestras de silencio: {num_silencio}')

        # ========== 1. EXTRAER KEYPOINTS ==========
        keypoints_permanent = f'data/keypoints/{nombre_sena.lower()}.json'
        keypoints_temp = output_path.replace('.h5', '_keypoints.json')

        extract_cmd = ExtractCommand()

        self.stdout.write('Extrayendo keypoints...')
        extract_cmd.handle(
            video=video_path,
            output=keypoints_temp,
            max_frames=60,
            confianza=0.2,
            resize=0.5,
            detectar_pose=True,
            solo_detectados=False,
            debug_video=False
        )

        # Copiar keypoints a ubicación permanente
        import shutil
        os.makedirs('data/keypoints', exist_ok=True)
        shutil.copy(keypoints_temp, keypoints_permanent)
        self.stdout.write(f'Keypoints guardados permanentemente en: {keypoints_permanent}')

        # ========== 2. GENERAR DATASET AUMENTADO ==========
        csv_path = output_path.replace('.h5', '_dataset.csv')
        augment_cmd = AugmentCommand()
        
        self.stdout.write('Generando dataset aumentado...')
        augment_cmd.handle(
            input=keypoints_permanent,
            output=csv_path,
            num_sena=num_sena,
            num_silencio=num_silencio,
            seq_length=seq_length
        )

        # ========== 3. CARGAR Y PREPARAR DATOS ==========
        self.stdout.write('Cargando dataset...')
        df = pd.read_csv(csv_path)
        
        # Verificar que tiene la columna 'label'
        if 'label' not in df.columns:
            self.stdout.write(self.style.ERROR('El dataset no tiene columna label'))
            return

        X = df.drop('label', axis=1).values
        y = df['label'].values

        # Calcular características por frame (225 = 99 pose + 63 mano der + 63 mano izq)
        total_features = X.shape[1]
        n_features = total_features // seq_length
        
        self.stdout.write(f'Dataset: {len(X)} muestras')
        self.stdout.write(f'Total caracteristicas por muestra: {total_features}')
        self.stdout.write(f'Longitud de secuencia: {seq_length}')
        self.stdout.write(f'Caracteristicas por frame: {n_features}')
        
        # Verificar que n_features es 225
        if n_features != 225:
            self.stdout.write(self.style.WARNING(
                f'ATENCION: n_features = {n_features}, se esperaba 225. '
                f'Verifica que extract.py este generando 225 features (99 pose + 63 right + 63 left)'
            ))

        # Normalizar
        scaler = StandardScaler()
        X_reshaped = X.reshape(-1, n_features)
        X_normalized = scaler.fit_transform(X_reshaped)
        X = X_normalized.reshape(-1, seq_length, n_features)

        # Dividir
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        self.stdout.write(f'Entrenamiento: {len(X_train)} muestras')
        self.stdout.write(f'Validacion: {len(X_val)} muestras')
        self.stdout.write(f'Shape X_train: {X_train.shape}')

        # ========== 4. MODELO LSTM ==========
        model = Sequential([
            Bidirectional(LSTM(64, return_sequences=True, dropout=0.3, recurrent_dropout=0.3), 
                        input_shape=(seq_length, n_features)),
            Bidirectional(LSTM(32, return_sequences=False, dropout=0.3, recurrent_dropout=0.3)),
            Dropout(0.4),
            Dense(16, activation='relu'),
            Dropout(0.3),
            Dense(8, activation='relu'),
            Dropout(0.2),
            Dense(1, activation='sigmoid')
        ])

        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )

        # Callbacks
        early_stop = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True)
        reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=0.00001)

        self.stdout.write(f'Entrenando modelo para: {nombre_sena}')
        
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=16,
            verbose=1,
            callbacks=[early_stop, reduce_lr]
        )

        # ========== 5. GUARDAR MODELO Y METADATOS ==========
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        model.save(output_path)
        
        # Guardar scaler
        scaler_path = output_path.replace('.h5', '_scaler.pkl')
        joblib.dump(scaler, scaler_path)
        
        # Guardar metadatos
        metadata = {
            'seq_length': seq_length,
            'n_features': n_features,
            'nombre_sena': nombre_sena,
            'num_muestras_sena': num_sena,
            'num_muestras_silencio': num_silencio,
            'accuracy': float(history.history['accuracy'][-1]),
            'val_accuracy': float(history.history['val_accuracy'][-1])
        }
        
        metadata_path = output_path.replace('.h5', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        # Limpiar archivos temporales
        if os.path.exists(csv_path):
            os.remove(csv_path)

        self.stdout.write(self.style.SUCCESS(f'Modelo guardado: {output_path}'))
        self.stdout.write(self.style.SUCCESS(f'Scaler guardado: {scaler_path}'))
        self.stdout.write(self.style.SUCCESS(f'Metadata guardada: {metadata_path}'))
        self.stdout.write(f'Precision final: {history.history["accuracy"][-1]*100:.2f}%')
        self.stdout.write(f'Precision validacion: {history.history["val_accuracy"][-1]*100:.2f}%')