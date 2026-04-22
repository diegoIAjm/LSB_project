import json
import numpy as np
import pandas as pd
import random
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Genera dataset aumentado a partir de keypoints'

    def add_arguments(self, parser):
        parser.add_argument('--input', type=str, required=True, help='Archivo JSON con keypoints')
        parser.add_argument('--output', type=str, required=True, help='Archivo CSV de salida')
        parser.add_argument('--num', type=int, default=500, help='Número de variaciones')

    def handle(self, *args, **options):
        input_path = options['input']
        output_path = options['output']
        num_variations = options['num']
        
        self.stdout.write(f'📊 Cargando keypoints de: {input_path}')
        
        with open(input_path, 'r') as f:
            keypoints = json.load(f)
        
        self.stdout.write(f'   Frames: {len(keypoints)}')
        self.stdout.write(f'   Generando {num_variations} variaciones...')
        
        variations = []
        labels = []
        
        for i in range(num_variations):
            if (i + 1) % 100 == 0:
                self.stdout.write(f'   Progreso: {i+1}/{num_variations}', ending='\r')
            
            seq = []
            for frame in keypoints:
                frame_features = []
                
                # Mano derecha
                right = np.array(frame['right_hand']).reshape(-1, 3)
                right = self._transform(right, scale_range=(0.85, 1.15),
                                        rotation_range=0.2, translation_range=0.15, noise=0.08)
                frame_features.extend(right.flatten().tolist())
                
                # Mano izquierda
                left = np.array(frame['left_hand']).reshape(-1, 3)
                left = self._transform(left, scale_range=(0.85, 1.15),
                                       rotation_range=0.2, translation_range=0.15, noise=0.08)
                frame_features.extend(left.flatten().tolist())
                
                seq.extend(frame_features)
            
            variations.append(seq)
            labels.append(1)  # Etiqueta positiva
        
        # Crear DataFrame
        df = pd.DataFrame(variations)
        df['label'] = labels
        
        # Guardar
        df.to_csv(output_path, index=False)
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Dataset guardado: {output_path}'))
        self.stdout.write(f'   Muestras: {df.shape[0]}, Features: {df.shape[1]-1}')
    
    def _transform(self, points, scale_range, rotation_range, translation_range, noise):
        """Aplica transformaciones a los puntos 3D"""
        if points is None or len(points) == 0:
            return np.zeros((21, 3))
        
        center = np.mean(points, axis=0)
        centered = points - center
        
        # Escala
        scale = random.uniform(*scale_range)
        scaled = centered * scale
        
        # Rotación en XY
        angle = random.uniform(-rotation_range, rotation_range)
        cos, sin = np.cos(angle), np.sin(angle)
        rot = np.array([[cos, -sin, 0], [sin, cos, 0], [0, 0, 1]])
        rotated = np.dot(scaled, rot.T)
        
        # Traslación
        translation = np.random.uniform(-translation_range, translation_range, 3)
        transformed = rotated + center + translation
        
        # Ruido
        noise_val = np.random.normal(0, noise, transformed.shape)
        result = transformed + noise_val
        
        return result