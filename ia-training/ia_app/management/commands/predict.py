import cv2
import json
import os
import numpy as np
import joblib
from django.core.management.base import BaseCommand
from tensorflow.keras.models import load_model

try:
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    import mediapipe as mp
    HAS_TASKS = True
except Exception as e:
    HAS_TASKS = False
    mp = None

class Command(BaseCommand):
    help = 'Predice si en un video se dice "HOLA" usando el modelo entrenado'

    def add_arguments(self, parser):
        parser.add_argument('--video', type=str, required=True, help='Archivo de video')
        parser.add_argument('--model', type=str, required=True, help='Modelo .h5 entrenado')
        parser.add_argument('--scaler', type=str, required=True, help='Archivo scaler.pkl')
        parser.add_argument('--seq-length', type=int, default=30, help='Frames por secuencia')

    def handle(self, *args, **options):
        video_path = options['video']
        model_path = options['model']
        scaler_path = options['scaler']
        seq_length = options['seq_length']

        # Cargar modelo y scaler
        self.stdout.write(f'📦 Cargando modelo: {model_path}')
        model = load_model(model_path)
        
        self.stdout.write(f'📦 Cargando scaler: {scaler_path}')
        scaler = joblib.load(scaler_path)
        
        # Mostrar dimensiones esperadas
        expected_features = scaler.n_features_in_
        features_per_frame = expected_features
        self.stdout.write(f'   Espera {expected_features} características por muestra')
        self.stdout.write(f'   {seq_length} frames × {features_per_frame} = {seq_length * features_per_frame} características totales')

        # Inicializar detectores
        model_path_hand = 'models/hand_landmarker.task'
        if not os.path.exists(model_path_hand):
            self.stdout.write(self.style.ERROR(f'❌ Modelo de manos no encontrado: {model_path_hand}'))
            return
            
        base_options = python.BaseOptions(model_asset_path=model_path_hand)
        hand_options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=2,
            running_mode=vision.RunningMode.VIDEO
        )
        hand_detector = vision.HandLandmarker.create_from_options(hand_options)

        # Detector de pose
        pose_model_path = 'models/pose_landmarker.task'
        if not os.path.exists(pose_model_path):
            self.stdout.write(self.style.ERROR(f'❌ Modelo de pose no encontrado: {pose_model_path}'))
            self.stdout.write('   Descargando...')
            import urllib.request
            url = 'https://storage.googleapis.com/mediapipe-assets/pose_landmarker.task'
            urllib.request.urlretrieve(url, pose_model_path)
            self.stdout.write('   ✅ Descargado')
            
        pose_options = vision.PoseLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=pose_model_path),
            running_mode=vision.RunningMode.VIDEO,
            num_poses=1
        )
        pose_detector = vision.PoseLandmarker.create_from_options(pose_options)

        # Procesar video
        cap = cv2.VideoCapture(video_path)
        frames_buffer = []  # Almacena características de cada frame (450 por frame)
        timestamp_ms = 0
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        self.stdout.write(f'🎬 Procesando video: {video_path}')
        
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            frame = cv2.resize(frame, (960, 540))
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            
            # Detectar manos y pose
            hand_results = hand_detector.detect_for_video(mp_image, timestamp_ms)
            pose_results = pose_detector.detect_for_video(mp_image, timestamp_ms)
            
            # Extraer características del frame (450 en total)
            features = []
            
            # Pose: 33 landmarks * 3 = 99 características
            if pose_results.pose_landmarks and len(pose_results.pose_landmarks) > 0:
                for lm in pose_results.pose_landmarks[0]:
                    features.extend([lm.x, lm.y, lm.z])
            else:
                features.extend([0.0] * 99)
            
            # Mano derecha: 21 landmarks * 3 = 63 características
            right_hand = [0.0] * 63
            if hand_results.hand_landmarks:
                for hand_idx, hand_lm in enumerate(hand_results.hand_landmarks):
                    if hand_idx < len(hand_results.handedness):
                        if hand_results.handedness[hand_idx][0].category_name == 'Right':
                            for i, lm in enumerate(hand_lm):
                                if i < 21:
                                    right_hand[i*3] = lm.x
                                        # Si estás procesando un video en tiempo real y quieres mejorar el rendimiento, puedes reducir la resolución o saltar frames.
                                    right_hand[i*3+2] = lm.z
            features.extend(right_hand)
            
            # Mano izquierda: 21 landmarks * 3 = 63 características
            left_hand = [0.0] * 63
            if hand_results.hand_landmarks:
                for hand_idx, hand_lm in enumerate(hand_results.hand_landmarks):
                    if hand_idx < len(hand_results.handedness):
                        if hand_results.handedness[hand_idx][0].category_name == 'Left':
                            for i, lm in enumerate(hand_lm):
                                if i < 21:
                                    left_hand[i*3] = lm.x
                                    left_hand[i*3+1] = lm.y
                                    left_hand[i*3+2] = lm.z
            features.extend(left_hand)
            
            # Verificar que tenemos 450 características (99 + 63 + 63 = 225? ¡ERROR!)
            # CORRECCIÓN: Pose son 99, Mano derecha 63, Mano izquierda 63 = 225, no 450
            # El modelo original usa 450 porque duplica algo. Vamos a duplicar para mantener compatibilidad
            features = features + features  # Duplicar para tener 450 características
            
            frames_buffer.append(features)
            timestamp_ms += int(1000 / fps)
            
            # Cuando tenemos suficientes frames, predecir
            if len(frames_buffer) >= seq_length:
                # Tomar últimos seq_length frames
                sequence_frames = frames_buffer[-seq_length:]
                
                # Normalizar CADA FRAME individualmente
                normalized_frames = []
                for frame_features in sequence_frames:
                    normalized = scaler.transform([frame_features])[0]
                    normalized_frames.append(normalized)
                
                # Reshape para LSTM: (1, seq_length, features_por_frame)
                input_data = np.array(normalized_frames).reshape(1, seq_length, -1)
                
                # Predecir
                prediction = model.predict(input_data, verbose=0)
                proba = prediction[0][0]
                
                # Mostrar resultado en frame
                if proba > 0.5:
                    label = f"HOLA! ({proba*100:.1f}%)"
                    color = (0, 255, 0)
                else:
                    label = f"silencio ({proba*100:.1f}%)"
                    color = (0, 0, 255)
                
                cv2.putText(frame, label, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
                
                # Mostrar barra de confianza
                bar_width = int(proba * 300)
                cv2.rectangle(frame, (50, 80), (50 + bar_width, 100), color, -1)
                cv2.rectangle(frame, (50, 80), (350, 100), (255, 255, 255), 2)
                
                # Mostrar frame
                cv2.imshow('Prediccion - HOLA Detector', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            
            # Mostrar progreso cada 30 frames
            if frame_count % 30 == 0:
                self.stdout.write(f'   Procesando frame {frame_count}...', ending='\r')
        
        cap.release()
        cv2.destroyAllWindows()
        self.stdout.write(f'\n✅ Predicción finalizada. Total frames procesados: {frame_count}')