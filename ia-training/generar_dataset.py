# generar_dataset.py
import json
import numpy as np
import pandas as pd
import random
import os

def generar_dataset_aumentado(archivo_json, num_variaciones=500):
    """Genera dataset aumentado a partir de keypoints capturados"""
    
    with open(archivo_json, 'r') as f:
        data = json.load(f)
    
    print(f"📊 Archivo original: {len(data)} frames")
    print(f"   Estructura: {type(data[0])}")
    
    # Aplanar cada frame a 126 características (2 manos * 21 puntos * 3 coordenadas)
    def aplanar_frame(frame):
        features = []
        
        # Si el frame es una lista de manos
        if isinstance(frame, list):
            for mano in frame:
                # mano es una lista de puntos (cada punto es [x,y,z])
                if isinstance(mano, list):
                    for punto in mano:
                        if isinstance(punto, list):
                            features.extend(punto[:3])  # x, y, z
                        else:
                            features.extend([0, 0, 0])
                else:
                    features.extend([0, 0, 0] * 21)
        else:
            features.extend([0, 0, 0] * 42)  # 2 manos * 21 puntos
        
        # Asegurar exactamente 126 características (2 manos * 21 puntos * 3)
        while len(features) < 126:
            features.extend([0, 0, 0])
        
        return features[:126]
    
    # Extraer frames
    frames = []
    for item in data:
        # Si el item ya es un frame
        if isinstance(item, list):
            frames.append(aplanar_frame(item))
        else:
            print(f"   Estructura inesperada: {type(item)}")
            continue
    
    print(f"✅ Frames procesados: {len(frames)}")
    print(f"   Características por frame: {len(frames[0]) if frames else 0}")
    
    if len(frames) == 0:
        print("❌ No se pudieron procesar los frames")
        return None
    
    # Generar variaciones aumentadas
    def aumentar_frame(frame_array, num_variaciones):
        variaciones = []
        for _ in range(num_variaciones):
            # Reestructurar como 42 puntos 3D (2 manos * 21 puntos)
            puntos = np.array(frame_array).reshape(-1, 3)
            
            # 1. Escala aleatoria (85% a 115%)
            escala = random.uniform(0.85, 1.15)
            puntos = puntos * escala
            
            # 2. Ruido gaussiano
            ruido = np.random.normal(0, 0.05, puntos.shape)
            puntos = puntos + ruido
            
            # 3. Rotación en Z (muñeca)
            angulo = random.uniform(-0.2, 0.2)
            cos, sin = np.cos(angulo), np.sin(angulo)
            rot_z = np.array([[cos, -sin, 0], [sin, cos, 0], [0, 0, 1]])
            puntos = np.dot(puntos, rot_z.T)
            
            # 4. Traslación pequeña
            traslacion = np.random.uniform(-0.05, 0.05, 3)
            puntos = puntos + traslacion
            
            variaciones.append(puntos.flatten().tolist())
        return variaciones
    
    print(f"🔄 Generando {num_variaciones} variaciones por frame...")
    
    # Generar dataset
    dataset = []
    
    # Añadir frames originales
    for frame in frames:
        dataset.append(frame + [1])  # 1 = seña positiva
    
    # Añadir variaciones
    for frame in frames:
        variaciones = aumentar_frame(frame, num_variaciones)
        for var in variaciones:
            dataset.append(var + [1])
    
    # Crear DataFrame
    df = pd.DataFrame(dataset)
    
    # Guardar CSV
    nombre_base = os.path.splitext(os.path.basename(archivo_json))[0]
    output_csv = f"data/augmented/{nombre_base}_dataset.csv"
    os.makedirs("data/augmented", exist_ok=True)
    df.to_csv(output_csv, index=False, header=False)
    
    print(f"\n✅ Dataset guardado: {output_csv}")
    print(f"   Total muestras: {len(df)}")
    print(f"   Características: {df.shape[1]-1}")
    print(f"   Frames originales: {len(frames)}")
    print(f"   Variaciones por frame: {num_variaciones}")
    
    return output_csv

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Uso: python generar_dataset.py <archivo_json>")
        print("Ejemplo: python generar_dataset.py data/keypoints/seña_1234567890.json")
        print("\nTambién puedes especificar el número de variaciones:")
        print("python generar_dataset.py data/keypoints/seña.json --variaciones 1000")
    else:
        archivo = sys.argv[1]
        num_var = 500
        if len(sys.argv) > 2 and sys.argv[2] == '--variaciones':
            num_var = int(sys.argv[3])
        generar_dataset_aumentado(archivo, num_var)