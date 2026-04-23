import cv2
import mediapipe as mp
import json
import os
from django.core.management.base import BaseCommand
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

class Command(BaseCommand):
    help = 'Extrae keypoints de un video'

    def add_arguments(self, parser):
        parser.add_argument('--video', type=str, required=True)
        parser.add_argument('--output', type=str, required=True)

    def handle(self, *args, **options):
        video_path = options['video']
        output_path = options['output']
        
        self.stdout.write(f'📹 Procesando: {video_path}')
        
        # Verificar que el video existe
        if not os.path.exists(video_path):
            self.stdout.write(self.style.ERROR(f'❌ Video no encontrado: {video_path}'))
            return
        
        # Crear opciones para HandLandmarker
        model_path = 'models/hand_landmarker.task'
        if not os.path.exists(model_path):
            self.stdout.write(self.style.ERROR(f'❌ Modelo no encontrado: {model_path}'))
            return
        
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=2
        )
        detector = vision.HandLandmarker.create_from_options(options)
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            self.stdout.write(self.style.ERROR(f'❌ No se pudo abrir el video: {video_path}'))
            return
        
        # Obtener información del video
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.stdout.write(f'   FPS: {fps}, Total frames: {total_frames}')
        
        keypoints = []
        frame_count = 0
        max_frames = min(30, total_frames) if total_frames > 0 else 30
        manos_detectadas = 0
        
        while cap.isOpened() and frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Redimensionar para mejor rendimiento
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            results = detector.detect(mp_image)
            
            right_hand = [0.0] * 63
            left_hand = [0.0] * 63
            
            if results.hand_landmarks:
                manos_detectadas += 1
                for idx, hand_landmarks in enumerate(results.hand_landmarks):
                    if idx < len(results.handedness):
                        handedness = results.handedness[idx][0].category_name
                        points = []
                        for lm in hand_landmarks:
                            points.extend([lm.x, lm.y, lm.z])
                        
                        if handedness == 'Right':
                            right_hand = points
                        else:
                            left_hand = points
            
            frame_data = {
                'frame': frame_count,
                'right_hand': right_hand,
                'left_hand': left_hand
            }
            keypoints.append(frame_data)
            frame_count += 1
            self.stdout.write(f'   Frame {frame_count}/{max_frames} - Manos: {len(results.hand_landmarks) if results.hand_landmarks else 0}', ending='\r')
        
        cap.release()
        detector.close()
        
        self.stdout.write('')  # Nueva línea
        self.stdout.write(f'   📊 Manos detectadas en {manos_detectadas}/{frame_count} frames')
        
        if manos_detectadas == 0:
            self.stdout.write(self.style.WARNING('⚠️ No se detectaron manos. Verifica que el video muestre manos claramente.'))
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(keypoints, f)
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Guardado: {output_path}'))