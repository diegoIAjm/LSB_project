import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from django.core.management.base import BaseCommand
from sklearn.metrics import confusion_matrix, classification_report
import joblib

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

        # MOSTRAR ESTADÍSTICAS DEL DATASET
        self.stdout.write(f'\n📈 ESTADÍSTICAS DEL DATASET:')
        self.stdout.write(f'   Total muestras: {len(df)}')
        
        # Verificar clases
        clases = df['label'].unique()
        self.stdout.write(f'   Clases encontradas: {clases}')
        
        # Contar por clase
        for clase in clases:
            count = (df['label'] == clase).sum()
            porcentaje = (count / len(df)) * 100
            self.stdout.write(f'   Clase {clase}: {count} muestras ({porcentaje:.1f}%)')
        
        # DIAGNÓSTICO: Ver si hay solo una clase en el CSV
        if len(clases) == 1:
            self.stdout.write(self.style.ERROR(f'\n❌ ERROR CRÍTICO: El dataset solo tiene UNA CLASE ({clases[0]})'))
            self.stdout.write(f'   Necesitas al menos 2 clases para entrenar (ej: HOLA y SILENCIO)')
            self.stdout.write(f'   Tu archivo CSV solo contiene la clase {clases[0]}')
            return
        
        X = df.drop('label', axis=1).values
        y = df['label'].values

        total_features = X.shape[1]
        if total_features % seq_length != 0:
            raise ValueError(
                f'El número de características ({total_features}) no es divisible por seq_length ({seq_length}). '
                'Verifica que el dataset esté formado por secuencias completas.'
            )

        n_features = total_features // seq_length
        
        # DIAGNÓSTICO: Ver si TODOS los valores son cero
        total_zeros = np.sum(X == 0)
        if total_zeros == X.size:
            self.stdout.write(self.style.ERROR(f'\n❌ ERROR CRÍTICO: TODOS los valores son CERO'))
            self.stdout.write(f'   Tu archivo CSV solo contiene ceros')
            self.stdout.write(f'   Verifica que el extractor de keypoints esté funcionando correctamente')
            return
        
        self.stdout.write(f'\n🔄 Normalizando datos...')
        scaler = StandardScaler()
        X_reshaped = X.reshape(-1, n_features)
        X_normalized = scaler.fit_transform(X_reshaped)
        X = X_normalized.reshape(-1, seq_length, n_features)
        
        self.stdout.write(f'   Muestras: {X.shape[0]}, Frames por secuencia: {seq_length}, Features por frame: {n_features}')
        
        # Dividir con estratificación para mantener balance
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        self.stdout.write(f'   Entrenamiento: {len(X_train)} muestras')
        self.stdout.write(f'   Validación: {len(X_val)} muestras')
        
        # Verificar distribución de clases en entrenamiento
        self.stdout.write(f'\n📊 Distribución en entrenamiento:')
        for clase in clases:
            count = (y_train == clase).sum()
            porcentaje = (count / len(y_train)) * 100
            self.stdout.write(f'   Clase {clase}: {count} muestras ({porcentaje:.1f}%)')
        
        # Construir modelo más pequeño para evitar sobreajuste
        model = Sequential([
            LSTM(32, return_sequences=True, input_shape=(seq_length, n_features), 
                 dropout=0.3, recurrent_dropout=0.3),
            LSTM(16, return_sequences=False, dropout=0.3, recurrent_dropout=0.3),
            Dropout(0.3),
            Dense(8, activation='relu'),
            Dropout(0.3),
            Dense(1, activation='sigmoid')
        ])
        
        model.compile(optimizer=Adam(learning_rate=0.001),
                      loss='binary_crossentropy',
                      metrics=['accuracy'])
        
        # Early stopping para evitar sobreajuste
        early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
        
        model.summary()
        
        self.stdout.write(f'🚀 Entrenando modelo...\n')
        
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=16,  # Batch más pequeño
            verbose=1,
            callbacks=[early_stop]
        )
        
        # EVALUACIÓN DETALLADA
        self.stdout.write(f'\n📊 EVALUACIÓN DEL MODELO:')
        
        # Predecir en validación
        y_pred_prob = model.predict(X_val)
        y_pred = (y_pred_prob > 0.5).astype(int).flatten()
        
        # Mostrar estadísticas de predicciones
        unicosc = np.unique(y_pred)
        self.stdout.write(f'\n   Predicciones únicas: {unicosc}')
        self.stdout.write(f'   Predicción promedio: {y_pred.mean():.3f}')
        self.stdout.write(f'   Probabilidad promedio: {y_pred_prob.mean():.3f}')
        
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        
        acc = accuracy_score(y_val, y_pred)
        prec = precision_score(y_val, y_pred, zero_division=0)
        rec = recall_score(y_val, y_pred, zero_division=0)
        f1 = f1_score(y_val, y_pred, zero_division=0)
        
        self.stdout.write(f'\n   📈 Precisión (Accuracy): {acc*100:.2f}%')
        self.stdout.write(f'   📈 Precisión (Precision): {prec*100:.2f}%')
        self.stdout.write(f'   📈 Sensibilidad (Recall): {rec*100:.2f}%')
        self.stdout.write(f'   📈 F1-Score: {f1*100:.2f}%')
        
        # Matriz de confusión (manejo seguro)
        try:
            cm = confusion_matrix(y_val, y_pred, labels=[0, 1])
            self.stdout.write(f'\n📊 MATRIZ DE CONFUSIÓN:')
            self.stdout.write(f'              Predicho')
            self.stdout.write(f'              Neg   Pos')
            
            if cm.shape == (2, 2):
                self.stdout.write(f'   Real Neg   {cm[0,0]:4d}  {cm[0,1]:4d}')
                self.stdout.write(f'        Pos   {cm[1,0]:4d}  {cm[1,1]:4d}')
            else:
                self.stdout.write(f'   Matriz de confusión tiene forma {cm.shape}')
                self.stdout.write(f'   Posiblemente solo hay una clase en las predicciones')
                self.stdout.write(f'   y_real: {np.unique(y_val)}')
                self.stdout.write(f'   y_pred: {np.unique(y_pred)}')
        except Exception as e:
            self.stdout.write(f'   Error en matriz de confusión: {e}')
        
        # DIAGNÓSTICO FINAL
        self.stdout.write(f'\n🔍 DIAGNÓSTICO FINAL:')
        
        # Verificar si todas las predicciones son iguales
        if len(np.unique(y_pred)) == 1:
            self.stdout.write(self.style.ERROR(
                f'   ❌ PROBLEMA DETECTADO: El modelo predice TODO como {np.unique(y_pred)[0]}'
            ))
            self.stdout.write(f'\n   Posibles causas:')
            self.stdout.write(f'   1. El dataset está desbalanceado (solo una clase en validación)')
            self.stdout.write(f'   2. Los landmarks extraídos no tienen variación')
            self.stdout.write(f'   3. El modelo es demasiado simple')
            self.stdout.write(f'   4. Necesitas más épocas o un modelo más complejo')
        
        # Verificar valores en datos
        self.stdout.write(f'\n📊 VERIFICACIÓN DE DATOS:')
        sample_features = X[0].flatten()
        non_zero = np.sum(np.abs(sample_features) > 1e-6)
        self.stdout.write(f'   Características no-cero en primera muestra: {non_zero}/{len(sample_features)}')
        
        if non_zero < len(sample_features) * 0.1:
            self.stdout.write(self.style.WARNING(
                f'   ⚠️ Pocas características no-cero ({non_zero}/{len(sample_features)})'
            ))
            self.stdout.write(f'   Los datos pueden ser muy esparsos')
        
        # Guardar modelo
        model.save(output_path)
        
        # Guardar scaler
        scaler_path = output_path.replace('.h5', '_scaler.pkl')
        joblib.dump(scaler, scaler_path)
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Modelo guardado en: {output_path}'))
        self.stdout.write(self.style.SUCCESS(f'✅ Scaler guardado en: {scaler_path}'))