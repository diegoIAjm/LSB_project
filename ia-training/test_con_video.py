# test_con_video_correcto.py
import numpy as np
from tensorflow.keras.models import load_model
import joblib
import json
import os
import sys

# Importar el mismo extract que usa train
from ia_app.management.commands.extract import Command as ExtractCommand

def test_modelo_con_video(model_path, scaler_path, metadata_path, video_path):
    """Prueba el modelo usando el mismo extract.py del entrenamiento"""
    
    print("="*60)
    print("PRUEBA CON EXTRACT.PY (mismo que usó el entrenamiento)")
    print("="*60)
    
    # Cargar modelo
    model = load_model(model_path)
    scaler = joblib.load(scaler_path)
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    seq_length = metadata['seq_length']
    n_features = metadata['n_features']
    
    print(f"\n📹 Video: {video_path}")
    
    # Extraer keypoints usando el mismo comando extract
    temp_output = video_path.replace('.mp4', '_temp_keypoints.json').replace('data/raw/', 'temp/')
    os.makedirs('temp', exist_ok=True)
    
    extract_cmd = ExtractCommand()
    extract_cmd.handle(
        video=video_path,
        output=temp_output,
        max_frames=60,
        confianza=0.2,
        resize=0.5,
        detectar_pose=True,
        solo_detectados=False,
        debug_video=False
    )
    
    # Cargar keypoints extraídos
    with open(temp_output, 'r') as f:
        keypoints = json.load(f)
    
    print(f"   Frames extraídos: {len(keypoints)}")
    
    # Preparar secuencia (igual que en train)
    seq = []
    for frame_idx in range(seq_length):
        source_idx = frame_idx % len(keypoints)
        frame = keypoints[source_idx]
        
        if 'features' in frame:
            points = np.array(frame['features'])
        else:
            pose = frame.get('pose', [0.0]*99)
            right = frame.get('right_hand', [0.0]*63)
            left = frame.get('left_hand', [0.0]*63)
            points = np.array(pose + right + left)
        
        if len(points) < n_features:
            points = np.pad(points, (0, n_features - len(points)))
        else:
            points = points[:n_features]
        
        seq.extend(points.tolist())
    
    # Normalizar y predecir
    X = np.array(seq).reshape(1, seq_length, n_features)
    X_reshaped = X.reshape(-1, n_features)
    X_normalized = scaler.transform(X_reshaped)
    X_test = X_normalized.reshape(1, seq_length, n_features)
    
    prediccion = model.predict(X_test, verbose=0)[0][0]
    
    # Limpiar
    if os.path.exists(temp_output):
        os.remove(temp_output)
    
    print("\n" + "="*60)
    print("RESULTADO")
    print("="*60)
    print(f"Predicción: {prediccion:.3f}")
    print(f"Umbral: {metadata.get('umbral_recomendado', 0.60)}")
    
    umbral = metadata.get('umbral_recomendado', 0.60)
    
    if prediccion > umbral:
        print(f"\n✅ RESULTADO: SEÑA DETECTADA")
        confianza = (prediccion - umbral) / (1 - umbral)
        print(f"   Confianza: {confianza*100:.1f}%")
    else:
        print(f"\n❌ RESULTADO: SILENCIO")
        if prediccion < 0.1:
            print(f"   ⚠️ Predicción muy baja - posible problema en extracción")
    
    print("="*60)
    return prediccion

if __name__ == "__main__":
    # Probar con el video de entrenamiento
    resultado = test_modelo_con_video(
        model_path='models/modelo_U_balanceado.h5',
        scaler_path='models/modelo_U_balanceado_scaler.pkl',
        metadata_path='models/modelo_U_balanceado_metadata.json',
        video_path='data/raw/U.mp4'
    )
    
    # También prueba con tu nuevo video
    print("\n" + "\n"*2)
    resultado2 = test_modelo_con_video(
        model_path='models/modelo_U_balanceado.h5',
        scaler_path='models/modelo_U_balanceado_scaler.pkl',
        metadata_path='models/modelo_U_balanceado_metadata.json',
        video_path='data/raw/MiU.mp4'
    )