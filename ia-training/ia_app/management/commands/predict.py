import cv2
import json
import numpy as np
import joblib
import os
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
        parser.add_argument('--output', type=str, default=None, help='Guardar video con predicciones (opcional)')

    def handle(self, *args, **options):
        video_path = options['video']
        model_path = options['model']
        scaler_path = options['scaler']
        seq_length = options['seq_length']
        output_path = options['output']

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
            self.stdout.write(self.style.WARNING(f'⚠️ Modelo de pose no encontrado: {pose_model_path}'))
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
        frames_buffer = []
        timestamp_ms = 0
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Configurar video de salida si es necesario
        out_writer = None
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            out_writer = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))
            self.stdout.write(f'📹 Guardando video en: {output_path}')
        
        self.stdout.write(f'🎬 Procesando video: {video_path}')
        self.stdout.write(f'   Presiona "q" para salir, "p" para pausar')
        
        frame_count = 0
        predictions_history = []
        paused = False
        
        while cap.isOpened():
            if not paused:
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
                
                # Extraer características del frame
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
                                        right_hand[i*3+1] = lm.y
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
                
                # Duplicar para llegar a 450 (compatibilidad)
                if len(features) == 225:
                    features = features + features
                
                frames_buffer.append(features)
                timestamp_ms += int(1000 / fps)
                
                # Predecir cuando tenemos suficientes frames
                proba = 0.5  # valor por defecto
                if len(frames_buffer) >= seq_length:
                    sequence_frames = frames_buffer[-seq_length:]
                    
                    normalized_frames = []
                    for frame_features in sequence_frames:
                        frame_array = np.array(frame_features).reshape(1, -1)
                        normalized = scaler.transform(frame_array)[0]
                        normalized_frames.append(normalized)
                    
                    input_data = np.array(normalized_frames).reshape(1, seq_length, -1)
                    prediction = model.predict(input_data, verbose=0)
                    proba = prediction[0][0]
                    predictions_history.append(proba)
                
                # Mostrar resultado en frame
                if proba > 0.6:
                    label = f"🤚 HOLA! ({proba*100:.1f}%)"
                    color = (0, 255, 0)
                elif proba > 0.4:
                    label = f"🤔 Quizás... ({proba*100:.1f}%)"
                    color = (0, 255, 255)
                else:
                    label = f"😐 Silencio ({proba*100:.1f}%)"
                    color = (0, 0, 255)
                
                # Fondo para el texto
                cv2.rectangle(frame, (10, 10), (400, 100), (0, 0, 0), -1)
                cv2.putText(frame, label, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
                
                # Barra de confianza
                bar_width = int(proba * 350)
                cv2.rectangle(frame, (20, 65), (20 + bar_width, 85), color, -1)
                cv2.rectangle(frame, (20, 65), (370, 85), (255, 255, 255), 2)
                
                # Mostrar frame actual / total
                cv2.putText(frame, f"Frame: {frame_count}", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)
                
                # Mostrar predicción en consola cada 10 frames
                if frame_count % 10 == 0:
                    self.stdout.write(f'   Frame {frame_count}: {label}')
                
                # Guardar video si es necesario
                if out_writer:
                    out_writer.write(frame)
                
                # Mostrar frame
                cv2.imshow('Prediccion - HOLA Detector', frame)
            
            # Controles de teclado
            key = cv2.waitKey(30) & 0xFF
            if key == ord('q'):
                self.stdout.write('   👋 Salida solicitada')
                break
            elif key == ord('p'):
                paused = not paused
                self.stdout.write(f'   {"⏸️ Pausado" if paused else "▶️ Reanudado"}')
            elif key == ord('s'):
                # Guardar frame actual como imagen
                cv2.imwrite(f'frame_{frame_count}.png', frame)
                self.stdout.write(f'   💾 Frame {frame_count} guardado')
        
        # Mostrar estadísticas finales
        if predictions_history:
            avg_prediction = np.mean(predictions_history)
            self.stdout.write(f'\n📊 Estadísticas finales:')
            self.stdout.write(f'   Promedio de predicción: {avg_prediction*100:.1f}%')
            self.stdout.write(f'   Frames procesados: {frame_count}')
            if avg_prediction > 0.5:
                self.stdout.write(self.style.SUCCESS(f'   ✅ RESULTADO: Se detectó "HOLA" en el video'))
            else:
                self.stdout.write(self.style.WARNING(f'   ❌ RESULTADO: No se detectó "HOLA" en el video'))
        
        cap.release()
        if out_writer:
            out_writer.release()
        cv2.destroyAllWindows()
        self.stdout.write(f'\n✅ Predicción finalizada')