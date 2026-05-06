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
        
        self.stdout.write(f'📊 Cargando keypoints de: {input_path}')
        
        with open(input_path, 'r') as f:
            keypoints = json.load(f)
        
        self.stdout.write(f'   Frames: {len(keypoints)}')
        self.stdout.write(f'   Generando {num_hola} muestras de HOLA y {num_silencio} de SILENCIO...')
        
        all_samples = []
        
        # Generar muestras de HOLA (clase 1)
        self.stdout.write(f'\n🟢 Generando HOLA (clase 1)...')
        for i in range(num_hola):
            if (i + 1) % 50 == 0:
                self.stdout.write(f'   HOLA: {i+1}/{num_hola}', ending='\r')
            
            seq = self.generate_sequence(keypoints, is_hola=True)
            seq.append(1)  # Etiqueta 1 al final
            all_samples.append(seq)
        
        self.stdout.write(f'\n   HOLA: {num_hola}/{num_hola}')
        
        # Generar muestras de SILENCIO (clase 0)
        self.stdout.write(f'\n🔴 Generando SILENCIO (clase 0)...')
        for i in range(num_silencio):
            if (i + 1) % 50 == 0:
                self.stdout.write(f'   SILENCIO: {i+1}/{num_silencio}', ending='\r')
            
            seq = self.generate_sequence(keypoints, is_hola=False)
            seq.append(0)  # Etiqueta 0 al final
            all_samples.append(seq)
        
        self.stdout.write(f'\n   SILENCIO: {num_silencio}/{num_silencio}')
        
        # Mezclar
        random.shuffle(all_samples)
        
        # Crear DataFrame con nombres de columnas
        # La última columna es 'label', el resto son características
        num_features = len(all_samples[0]) - 1
        column_names = [f'f_{i}' for i in range(num_features)] + ['label']
        
        df = pd.DataFrame(all_samples, columns=column_names)
        df.to_csv(output_path, index=False)
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Dataset balanceado guardado: {output_path}'))
        self.stdout.write(f'   Total muestras: {len(df)}')
        self.stdout.write(f'   Características por muestra: {num_features}')
        self.stdout.write(f'   Clase 1 (HOLA): {(df["label"]==1).sum()}')
        self.stdout.write(f'   Clase 0 (SILENCIO): {(df["label"]==0).sum()}')
    
    def generate_sequence(self, keypoints, is_hola=True):
        """Genera una secuencia de frames transformada"""
        seq = []
        
        for frame in keypoints:
            pose = np.array(frame.get('pose', [0.0] * 99)).reshape(-1, 3)
            right = np.array(frame.get('right_hand', [0.0] * 63)).reshape(-1, 3)
            left = np.array(frame.get('left_hand', [0.0] * 63)).reshape(-1, 3)

            all_points = np.vstack([pose, right, left])
            
            if is_hola:
                # HOLA: transformaciones suaves
                all_points = self._transform(
                    all_points,
                    scale_range=(0.92, 1.08),
                    rotation_range=0.15,
                    translation_range=0.08,
                    noise=0.04
                )
            else:
                # SILENCIO: transformaciones más agresivas
                transform_type = random.choice(['noise', 'scale', 'zero', 'random'])
                
                if transform_type == 'noise':
                    # Añadir mucho ruido
                    all_points = self._transform(
                        all_points,
                        scale_range=(1.0, 1.0),
                        rotation_range=0,
                        translation_range=0,
                        noise=0.3
                    )
                elif transform_type == 'scale':
                    # Escalar mucho
                    all_points = self._transform(
                        all_points,
                        scale_range=(0.3, 1.7),
                        rotation_range=0.3,
                        translation_range=0.2,
                        noise=0.15
                    )
                elif transform_type == 'zero':
                    # Silencio total (todos ceros)
                    all_points = np.zeros_like(all_points)
                else:
                    # Datos aleatorios
                    all_points = np.random.normal(0, 0.5, all_points.shape)

            pose_aug = all_points[:len(pose)].flatten().tolist()
            right_aug = all_points[len(pose):len(pose) + len(right)].flatten().tolist()
            left_aug = all_points[len(pose) + len(right):].flatten().tolist()

            seq.extend(pose_aug)
            seq.extend(right_aug)
            seq.extend(left_aug)
        
        return seq
    
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