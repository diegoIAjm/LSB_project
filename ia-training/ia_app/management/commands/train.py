# ia_app/management/commands/train.py
import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras import regularizers
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from django.core.management.base import BaseCommand
import joblib
import os
import json
import sys
import random

# Importar comandos
from .extract import Command as ExtractCommand
from .augment import Command as AugmentCommand


class Command(BaseCommand):
    help = 'Entrena modelo RNN para una seña especifica (modelo balanceado)'

    def add_arguments(self, parser):
        parser.add_argument('--video', type=str, required=True)
        parser.add_argument('--output', type=str, required=True)
        parser.add_argument('--nombre', type=str, required=True)
        parser.add_argument('--epochs', type=int, default=100)
        parser.add_argument('--seq-length', type=int, default=30, help='Longitud de secuencia para LSTM')
        parser.add_argument('--num-sena', type=int, default=1000, help='Numero de variaciones para la seña')
        parser.add_argument('--num-silencio', type=int, default=1000, help='Numero de variaciones para silencio')

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

        # Dividir con validación estratificada
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        self.stdout.write(f'Entrenamiento: {len(X_train)} muestras')
        self.stdout.write(f'Validacion: {len(X_val)} muestras')
        self.stdout.write(f'Shape X_train: {X_train.shape}')

        # ========== 4. MODELO LSTM BALANCEADO ==========
        self.stdout.write(self.style.WARNING('Usando modelo BALANCEADO (ni muy grande, ni muy pequeño)'))
        
        # Modelo balanceado - aprende bien sin sobreajustar
        model = Sequential([
            # Una capa LSTM de tamaño moderado
            LSTM(32, 
                 return_sequences=False,
                 dropout=0.4, 
                 recurrent_dropout=0.4,
                 kernel_regularizer=regularizers.l2(0.005),
                 input_shape=(seq_length, n_features)),
            
            # Capas densas moderadas
            Dense(16, activation='relu', kernel_regularizer=regularizers.l2(0.005)),
            Dropout(0.4),
            Dense(8, activation='relu', kernel_regularizer=regularizers.l2(0.005)),
            Dropout(0.3),
            Dense(1, activation='sigmoid')
        ])

        # Learning rate medio
        optimizer = Adam(learning_rate=0.0005)
        
        model.compile(
            optimizer=optimizer,
            loss='binary_crossentropy',
            metrics=['accuracy']
        )

        # Callbacks balanceados
        early_stop = EarlyStopping(
            monitor='val_loss', 
            patience=12,
            restore_best_weights=True,
            min_delta=0.005
        )
        
        reduce_lr = ReduceLROnPlateau(
            monitor='val_loss', 
            factor=0.5, 
            patience=5, 
            min_lr=0.00005
        )

        self.stdout.write(f'Entrenando modelo para: {nombre_sena}')
        self.stdout.write(f'Arquitectura: LSTM(32) -> Dense(16) -> Dense(8) -> Sigmoid')
        self.stdout.write(f'Dropout: 0.4 en LSTM, 0.4 en Dense1, 0.3 en Dense2')
        self.stdout.write(f'Regularización L2: 0.005')
        self.stdout.write(f'Learning rate: 0.0005')
        
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=32,
            verbose=1,
            callbacks=[early_stop, reduce_lr]
        )

        # ========== 5. GUARDAR MODELO Y METADATOS ==========
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        model.save(output_path)
        
        # Guardar scaler
        scaler_path = output_path.replace('.h5', '_scaler.pkl')
        joblib.dump(scaler, scaler_path)
        
        # Obtener la mejor precisión de validación
        best_val_acc = max(history.history['val_accuracy'])
        
        # Calcular métricas realistas (para un solo video)
        realistic_acc = min(best_val_acc * 0.85, 0.85)
        
        # Guardar metadatos
        metadata = {
            'seq_length': seq_length,
            'n_features': n_features,
            'nombre_sena': nombre_sena,
            'num_muestras_sena': num_sena,
            'num_muestras_silencio': num_silencio,
            'accuracy_entrenamiento_final': float(history.history['accuracy'][-1]),
            'accuracy_validacion_final': float(history.history['val_accuracy'][-1]),
            'mejor_accuracy_validacion': float(best_val_acc),
            'mejor_loss_validacion': float(min(history.history['val_loss'])),
            'accuracy_realista_estimada': float(realistic_acc),
            'epochs_completadas': len(history.history['loss']),
            'advertencia': 'Modelo entrenado con UN SOLO video - la precisión real será menor',
            'umbral_recomendado': 0.60,  # Umbral más bajo para mejor sensibilidad
            'recomendacion': 'Usar umbral 0.6 para mejor detección, 0.7 para mayor precision'
        }
        
        metadata_path = output_path.replace('.h5', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        # Limpiar archivos temporales
        if os.path.exists(csv_path):
            os.remove(csv_path)

        # Mostrar resultados con advertencia
        self.stdout.write(self.style.SUCCESS(f'\n Modelo guardado: {output_path}'))
        self.stdout.write(self.style.SUCCESS(f' Scaler guardado: {scaler_path}'))
        self.stdout.write(self.style.SUCCESS(f' Metadata guardada: {metadata_path}'))
        
        self.stdout.write(f'\n Estadísticas de entrenamiento:')
        self.stdout.write(f'   Épocas completadas: {len(history.history["loss"])}/{epochs}')
        self.stdout.write(f'   Mejor loss validación: {min(history.history["val_loss"]):.4f}')
        self.stdout.write(f'   Mejor accuracy validación: {best_val_acc*100:.2f}%')
        self.stdout.write(f'   Accuracy final entrenamiento: {history.history["accuracy"][-1]*100:.2f}%')
        
        self.stdout.write(self.style.WARNING('\n' + '='*60))
        self.stdout.write(self.style.WARNING('  ADVERTENCIA IMPORTANTE'))
        self.stdout.write(self.style.WARNING('='*60))
        self.stdout.write(self.style.WARNING(f' Modelo entrenado con UN SOLO video de la seña "{nombre_sena}"'))
        self.stdout.write(self.style.WARNING(f' Precisión REAL estimada en producción: {realistic_acc*100:.0f}%'))
        self.stdout.write(self.style.WARNING(f' Precisión en validación (optimista): {best_val_acc*100:.0f}%'))
        self.stdout.write(self.style.WARNING('\n Recomendaciones:'))
        self.stdout.write(self.style.WARNING('   • Usar umbral de decisión: 0.60 para más detecciones'))
        self.stdout.write(self.style.WARNING('   • Usar umbral 0.70 para mayor precisión'))
        self.stdout.write(self.style.WARNING('   • Recolectar más videos para mejorar el modelo'))
        self.stdout.write(self.style.WARNING('='*60))