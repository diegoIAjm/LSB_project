# test_inference.py
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import joblib
import json

def test_model():
    # Cargar modelo
    model = load_model('models/modelo_U_definitivo.h5')
    scaler = joblib.load('models/modelo_U_definitivo_scaler.pkl')
    
    # Cargar metadatos
    with open('models/modelo_U_definitivo_metadata.json', 'r') as f:
        metadata = json.load(f)
    
    print("="*50)
    print("PRUEBA DEL MODELO")
    print("="*50)
    print(f"Seña: {metadata['nombre_sena']}")
    print(f"Precisión real estimada: {metadata['accuracy_realista_estimada']*100:.0f}%")
    print(f"Umbral recomendado: {metadata['umbral_recomendado']}")
    print("="*50)
    
    # Prueba con ruido aleatorio (debería dar 0)
    print("\n1. Probando con RUIDO ALEATORIO:")
    ruido = np.random.normal(0, 0.1, (1, 30, 225))
    pred = model.predict(ruido, verbose=0)[0][0]
    print(f"   Predicción: {pred:.3f}")
    print(f"   {'🔴 SEÑA' if pred > 0.65 else '🟢 SILENCIO'}")
    
    # Prueba con ruido estructurado
    print("\n2. Probando con MOVIMIENTO ALEATORIO:")
    movimiento = np.zeros((30, 225))
    for t in range(1, 30):
        movimiento[t] = movimiento[t-1] + np.random.normal(0, 0.05, 225)
    pred = model.predict(movimiento.reshape(1, 30, 225), verbose=0)[0][0]
    print(f"   Predicción: {pred:.3f}")
    print(f"   {'🔴 SEÑA' if pred > 0.65 else '🟢 SILENCIO'}")
    
    # Múltiples pruebas
    print("\n3. Probando 20 muestras aleatorias:")
    resultados = []
    for i in range(20):
        test = np.random.normal(0, 0.15, (1, 30, 225))
        pred = model.predict(test, verbose=0)[0][0]
        resultados.append(pred)
    
    print(f"   Media: {np.mean(resultados):.3f}")
    print(f"   Std: {np.std(resultados):.3f}")
    print(f"   Máximo: {np.max(resultados):.3f}")
    print(f"   Mínimo: {np.min(resultados):.3f}")
    
    if np.max(resultados) < 0.65:
        print("\n✅ El modelo distingue bien el silencio")
    else:
        print("\n⚠️ El modelo a veces confunde ruido con seña")

if __name__ == "__main__":
    test_model()