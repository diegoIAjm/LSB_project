import json
import numpy as np
import pandas as pd
import random
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Genera dataset aumentado a partir de keypoints'

    def add_arguments(self, parser):
        parser.add_argument('--input', type=str, required=True)
        parser.add_argument('--output', type=str, required=True)
        parser.add_argument('--num-sena', type=int, default=200)
        parser.add_argument('--num-silencio', type=int, default=200)
        parser.add_argument('--seq-length', type=int, default=30)

    def handle(self, *args, **options):
        input_path = options['input']
        output_path = options['output']
        num_sena = options['num_sena']
        num_silencio = options['num_silencio']
        seq_length = options['seq_length']
        
        with open(input_path, 'r') as f:
            keypoints = json.load(f)
        
        FRAME_FEATURES = 225
        all_samples = []
        
        self.stdout.write(f'Generando {num_sena} señas y {num_silencio} silencios...')
        
        # Generar SEÑA (frames en orden)
        for i in range(num_sena):
            seq = self._generate_sena_sequence(keypoints, seq_length, FRAME_FEATURES)
            seq.append(1)
            all_samples.append(seq)
            if (i+1) % 50 == 0:
                self.stdout.write(f'  Seña: {i+1}/{num_sena}', ending='\r')
        
        self.stdout.write(f'\n  Seña: {num_sena}/{num_sena}')
        
        # Generar SILENCIO (frames en orden aleatorio)
        for i in range(num_silencio):
            seq = self._generate_silencio_sequence(keypoints, seq_length, FRAME_FEATURES)
            seq.append(0)
            all_samples.append(seq)
            if (i+1) % 50 == 0:
                self.stdout.write(f'  Silencio: {i+1}/{num_silencio}', ending='\r')
        
        self.stdout.write(f'\n  Silencio: {num_silencio}/{num_silencio}')
        
        random.shuffle(all_samples)
        
        # Crear DataFrame con nombres de columnas
        num_features = len(all_samples[0]) - 1
        column_names = [f'f_{i}' for i in range(num_features)] + ['label']
        df = pd.DataFrame(all_samples, columns=column_names)
        df.to_csv(output_path, index=False)  # <--- SIN header=False
        
        self.stdout.write(self.style.SUCCESS(f'Dataset guardado: {output_path}'))
        self.stdout.write(f'  Total: {len(df)} muestras')
        self.stdout.write(f'  Features por muestra: {num_features}')
        self.stdout.write(f'  Clase 1 (seña): {(df["label"]==1).sum()}')
        self.stdout.write(f'  Clase 0 (silencio): {(df["label"]==0).sum()}')
    
    def _generate_sena_sequence(self, keypoints, seq_length, frame_features):
        """Seña: frames en orden secuencial"""
        seq = []
        frames_available = len(keypoints)
        
        for frame_idx in range(seq_length):
            source_idx = frame_idx % frames_available
            frame = keypoints[source_idx]
            
            if 'features' in frame:
                points = np.array(frame['features'])
            else:
                pose = frame.get('pose', [0.0]*99)
                right = frame.get('right_hand', [0.0]*63)
                left = frame.get('left_hand', [0.0]*63)
                points = np.array(pose + right + left)
            
            # Asegurar dimensión correcta
            if len(points) < frame_features:
                points = np.pad(points, (0, frame_features - len(points)))
            elif len(points) > frame_features:
                points = points[:frame_features]
            
            # Aumento: ruido y escalado
            points = points * random.uniform(0.97, 1.03)
            points += np.random.normal(0, 0.03, frame_features)
            
            seq.extend(points.tolist())
        
        # Asegurar longitud exacta
        target_length = seq_length * frame_features
        if len(seq) < target_length:
            seq.extend([0.0] * (target_length - len(seq)))
        elif len(seq) > target_length:
            seq = seq[:target_length]
        
        return seq
    
    def _generate_silencio_sequence(self, keypoints, seq_length, frame_features):
        """Silencio: frames en orden ALEATORIO (misma información, sin secuencia)"""
        seq = []
        frames_available = len(keypoints)
        
        for _ in range(seq_length):
            # Frame aleatorio, NO secuencial
            source_idx = random.randint(0, frames_available - 1)
            frame = keypoints[source_idx]
            
            if 'features' in frame:
                points = np.array(frame['features'])
            else:
                pose = frame.get('pose', [0.0]*99)
                right = frame.get('right_hand', [0.0]*63)
                left = frame.get('left_hand', [0.0]*63)
                points = np.array(pose + right + left)
            
            # Asegurar dimensión correcta
            if len(points) < frame_features:
                points = np.pad(points, (0, frame_features - len(points)))
            elif len(points) > frame_features:
                points = points[:frame_features]
            
            # Mismo aumento que la seña
            points += np.random.normal(0, 0.03, frame_features)
            
            seq.extend(points.tolist())
        
        # Mezclar bloques para destruir estructura temporal
        block_size = frame_features
        num_blocks = len(seq) // block_size
        if num_blocks > 1:
            blocks = [seq[i*block_size:(i+1)*block_size] for i in range(num_blocks)]
            random.shuffle(blocks)
            seq = [item for block in blocks for item in block]
        
        # Asegurar longitud exacta
        target_length = seq_length * frame_features
        if len(seq) < target_length:
            seq.extend([0.0] * (target_length - len(seq)))
        elif len(seq) > target_length:
            seq = seq[:target_length]
        
        return seq