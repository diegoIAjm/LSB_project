import json
import numpy as np
import pandas as pd
import random
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Genera dataset aumentado a partir de keypoints (con silencio artificial)'

    def add_arguments(self, parser):
        parser.add_argument('--input', type=str, required=True, help='Archivo JSON con keypoints de la seña')
        parser.add_argument('--output', type=str, required=True, help='Archivo CSV de salida')
        parser.add_argument('--num-sena', type=int, default=200, help='Numero de variaciones para la seña')
        parser.add_argument('--num-silencio', type=int, default=200, help='Numero de variaciones para SILENCIO')
        parser.add_argument('--seq-length', type=int, default=30, help='Longitud de secuencia (frames por muestra)')

    def handle(self, *args, **options):
        input_path = options['input']
        output_path = options['output']
        num_sena = options['num_sena']
        num_silencio = options['num_silencio']
        seq_length = options['seq_length']
        
        self.stdout.write(f'Cargando keypoints de: {input_path}')
        
        with open(input_path, 'r') as f:
            keypoints = json.load(f)
        
        # Constantes
        FRAME_FEATURES = 225  # 99 pose + 63 right + 63 left
        TARGET_FEATURES = seq_length * FRAME_FEATURES
        
        self.stdout.write(f'   Frames originales: {len(keypoints)}')
        self.stdout.write(f'   Features por frame: {FRAME_FEATURES}')
        self.stdout.write(f'   Longitud de secuencia: {seq_length}')
        self.stdout.write(f'   Features por muestra: {TARGET_FEATURES}')
        self.stdout.write(f'   Generando {num_sena} muestras de la seña y {num_silencio} de silencio...')
        
        all_samples = []
        
        # Generar muestras de la SEÑA (clase 1)
        self.stdout.write(f'\nGenerando muestras de la seña (clase 1)...')
        for i in range(num_sena):
            if (i + 1) % 50 == 0:
                self.stdout.write(f'   Seña: {i+1}/{num_sena}', ending='\r')
            
            seq = self.generate_sequence(keypoints, is_sena=True, seq_length=seq_length, frame_features=FRAME_FEATURES)
            seq.append(1)
            all_samples.append(seq)
        
        self.stdout.write(f'\n   Seña: {num_sena}/{num_sena}')
        
        # Generar muestras de SILENCIO (clase 0)
        self.stdout.write(f'\nGenerando muestras de silencio (clase 0)...')
        for i in range(num_silencio):
            if (i + 1) % 50 == 0:
                self.stdout.write(f'   Silencio: {i+1}/{num_silencio}', ending='\r')
            
            seq = self.generate_sequence(keypoints, is_sena=False, seq_length=seq_length, frame_features=FRAME_FEATURES)
            seq.append(0)
            all_samples.append(seq)
        
        self.stdout.write(f'\n   Silencio: {num_silencio}/{num_silencio}')
        
        # Mezclar
        random.shuffle(all_samples)
        
        num_features = len(all_samples[0]) - 1
        column_names = [f'f_{i}' for i in range(num_features)] + ['label']
        
        df = pd.DataFrame(all_samples, columns=column_names)
        df.to_csv(output_path, index=False)
        
        self.stdout.write(self.style.SUCCESS(f'\nDataset guardado: {output_path}'))
        self.stdout.write(f'   Total muestras: {len(df)}')
        self.stdout.write(f'   Caracteristicas por muestra: {num_features}')
        self.stdout.write(f'   Clase 1 (seña): {(df["label"]==1).sum()}')
        self.stdout.write(f'   Clase 0 (silencio): {(df["label"]==0).sum()}')
    
    def generate_sequence(self, keypoints, is_sena=True, seq_length=30, frame_features=225):
        """Genera una secuencia de frames transformada"""
        seq = []
        
        # Tomar los primeros seq_length frames o repetir si hay menos
        frames_available = len(keypoints)
        
        for frame_idx in range(seq_length):
            # Ciclar frames si no hay suficientes
            source_idx = frame_idx % frames_available
            frame = keypoints[source_idx]
            
            # Obtener features del frame (priorizar campo 'features')
            if 'features' in frame:
                all_points = np.array(frame['features'])
            else:
                # Fallback para compatibilidad
                pose = frame.get('pose', [0.0] * 99)
                right = frame.get('right_hand', [0.0] * 63)
                left = frame.get('left_hand', [0.0] * 63)
                all_points = np.array(pose + right + left)
            
            # Asegurar dimension correcta
            if len(all_points) < frame_features:
                all_points = np.pad(all_points, (0, frame_features - len(all_points)))
            elif len(all_points) > frame_features:
                all_points = all_points[:frame_features]
            
            # Aplicar transformaciones
            if is_sena:
                # Para la seña: pequeñas variaciones
                noise = np.random.normal(0, 0.05, frame_features)
                scale = random.uniform(0.95, 1.05)
                all_points = all_points * scale + noise
            else:
                # Para silencio: ruido fuerte (movimiento aleatorio)
                all_points = all_points + np.random.normal(0, 0.3, frame_features)
            
            seq.extend(all_points.tolist())
        
        # Asegurar longitud exacta
        target_length = seq_length * frame_features
        if len(seq) < target_length:
            seq.extend([0.0] * (target_length - len(seq)))
        elif len(seq) > target_length:
            seq = seq[:target_length]
        
        return seq