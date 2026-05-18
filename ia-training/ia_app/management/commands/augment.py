import json
import numpy as np
import pandas as pd
import random
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Genera dataset aumentado a partir de keypoints (con silencio artificial)'

    def add_arguments(self, parser):
        parser.add_argument('--input', type=str, required=True, help='Archivo JSON con keypoints de HOLA')
        parser.add_argument('--output', type=str, required=True, help='Archivo CSV de salida')
        parser.add_argument('--num-hola', type=int, default=250, help='Número de variaciones para HOLA')
        parser.add_argument('--num-silencio', type=int, default=250, help='Número de variaciones para SILENCIO')

    def handle(self, *args, **options):
        input_path = options['input']
        output_path = options['output']
        num_hola = options['num_hola']
        num_silencio = options['num_silencio']
        
        self.stdout.write(f' Cargando keypoints de: {input_path}')
        
        with open(input_path, 'r') as f:
            keypoints = json.load(f)
        
        self.stdout.write(f'   Frames: {len(keypoints)}')
        self.stdout.write(f'   Generando {num_hola} muestras de HOLA y {num_silencio} de SILENCIO...')
        
        all_samples = []
        
        # Generar muestras de HOLA (clase 1)
        self.stdout.write(f'\n Generando HOLA (clase 1)...')
        for i in range(num_hola):
            if (i + 1) % 50 == 0:
                self.stdout.write(f'   HOLA: {i+1}/{num_hola}', ending='\r')
            
            seq = self.generate_sequence(keypoints, is_hola=True)
            seq.append(1)
            all_samples.append(seq)
        
        self.stdout.write(f'\n   HOLA: {num_hola}/{num_hola}')
        
        # Generar muestras de SILENCIO (clase 0)
        self.stdout.write(f'\n Generando SILENCIO (clase 0)...')
        for i in range(num_silencio):
            if (i + 1) % 50 == 0:
                self.stdout.write(f'   SILENCIO: {i+1}/{num_silencio}', ending='\r')
            
            seq = self.generate_sequence(keypoints, is_hola=False)
            seq.append(0)
            all_samples.append(seq)
        
        self.stdout.write(f'\n   SILENCIO: {num_silencio}/{num_silencio}')
        
        # Mezclar
        random.shuffle(all_samples)
        
        num_features = len(all_samples[0]) - 1
        column_names = [f'f_{i}' for i in range(num_features)] + ['label']
        
        df = pd.DataFrame(all_samples, columns=column_names)
        df.to_csv(output_path, index=False)
        
        self.stdout.write(self.style.SUCCESS(f'\n Dataset balanceado guardado: {output_path}'))
        self.stdout.write(f'   Total muestras: {len(df)}')
        self.stdout.write(f'   Características por muestra: {num_features}')
        self.stdout.write(f'   Clase 1 (HOLA): {(df["label"]==1).sum()}')
        self.stdout.write(f'   Clase 0 (SILENCIO): {(df["label"]==0).sum()}')
    
    def generate_sequence(self, keypoints, is_hola=True):
        """Genera una secuencia de frames transformada - FORZANDO 225 características por frame"""
        seq = []
        FRAME_FEATURES = 225  # 99 pose + 63 right + 63 left
        
        for frame in keypoints:
            # Obtener pose (99)
            pose = frame.get('pose', [0.0] * 99)
            if len(pose) < 99:
                pose = pose + [0.0] * (99 - len(pose))
            else:
                pose = pose[:99]
            
            # Obtener right_hand (63)
            right = frame.get('right_hand', [0.0] * 63)
            if len(right) < 63:
                right = right + [0.0] * (63 - len(right))
            else:
                right = right[:63]
            
            # Obtener left_hand (63)
            left = frame.get('left_hand', [0.0] * 63)
            if len(left) < 63:
                left = left + [0.0] * (63 - len(left))
            else:
                left = left[:63]
            
            # Combinar
            all_points = np.array(pose + right + left)
            
            # Transformar
            if is_hola:
                all_points = self._transform_simple(all_points)
            else:
                # Silencio: ruido
                all_points = all_points + np.random.normal(0, 0.3, len(all_points))
            
            seq.extend(all_points.tolist())
        
        # Asegurar longitud exacta: 30 frames * 225 = 6750
        target_length = 30 * FRAME_FEATURES
        if len(seq) < target_length:
            seq.extend([0.0] * (target_length - len(seq)))
        elif len(seq) > target_length:
            seq = seq[:target_length]
        
        return seq

    def _transform_simple(self, points):
        """Transformación simple para aumentar datos"""
        noise = np.random.normal(0, 0.05, len(points))
        scale = random.uniform(0.9, 1.1)
        return points * scale + noise

    def _transform(self, points, scale_range, rotation_range, translation_range, noise):
        """Aplica transformaciones coherentes 3D"""
        if points is None or len(points) == 0:
            return points

        center = np.mean(points, axis=0)
        centered = points - center
        
        scale = random.uniform(*scale_range)
        scaled = centered * scale
        
        rotated = self._rotate_3d(scaled, rotation_range)
        
        translation = np.random.uniform(-translation_range, translation_range, 3)
        transformed = rotated + center + translation
        
        noise_val = np.random.normal(0, noise, transformed.shape)
        return transformed + noise_val

    def _rotate_3d(self, points, angle_range):
        angles = np.random.uniform(-angle_range, angle_range, size=3)
        Rx = np.array([
            [1, 0, 0],
            [0, np.cos(angles[0]), -np.sin(angles[0])],
            [0, np.sin(angles[0]), np.cos(angles[0])]
        ])
        Ry = np.array([
            [np.cos(angles[1]), 0, np.sin(angles[1])],
            [0, 1, 0],
            [-np.sin(angles[1]), 0, np.cos(angles[1])]
        ])
        Rz = np.array([
            [np.cos(angles[2]), -np.sin(angles[2]), 0],
            [np.sin(angles[2]), np.cos(angles[2]), 0],
            [0, 0, 1]
        ])
        return points.dot(Rx.T).dot(Ry.T).dot(Rz.T)