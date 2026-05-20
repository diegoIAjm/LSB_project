# ia_app/management/commands/evaluar.py
import cv2
import json
import numpy as np
import joblib
import os
import sys
from django.core.management.base import BaseCommand
from tensorflow.keras.models import load_model

# Agregar la ruta del proyecto para importar correctamente
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    import mediapipe as mp
    HAS_TASKS = True
except ImportError:
    HAS_TASKS = False
    mp = None
    print("MediaPipe no disponible")

class Command(BaseCommand):
    help = 'Evalúa un video contra un modelo entrenado de seña'

    def add_arguments(self, parser):
        parser.add_argument('--video', type=str, required=True)
        parser.add_argument('--modelo', type=str, required=True)
        parser.add_argument('--scaler', type=str, required=True)

    def handle(self, *args, **options):
        video_path = options['video']
        modelo_path = options['modelo']
        scaler_path = options['scaler']

        self.stdout.write(f'Evaluando video: {video_path}')

        # Verificar archivos
        if not os.path.exists(video_path):
            self.stdout.write(self.style.ERROR(f'Video no encontrado: {video_path}'))
            return
        
        if not os.path.exists(modelo_path):
            self.stdout.write(self.style.ERROR(f'Modelo no encontrado: {modelo_path}'))
            return
        
        if not os.path.exists(scaler_path):
            self.stdout.write(self.style.ERROR(f'Scaler no encontrado: {scaler_path}'))
            return

        try:
            # Cargar modelo y scaler
            model = load_model(modelo_path)
            scaler = joblib.load(scaler_path)
            
            # Obtener dimensiones del modelo automáticamente
            input_shape = model.input_shape
            seq_length = input_shape[1]  # Por ejemplo: 30
            n_features = input_shape[2]  # Debería ser 225
            
            self.stdout.write(f'Modelo cargado correctamente')
            self.stdout.write(f'  Secuencia esperada: {seq_length} frames')
            self.stdout.write(f'  Features por frame: {n_features}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error cargando modelo: {e}'))
            return

        # Extraer keypoints
        keypoints = self._extraer_keypoints(video_path)
        
        if not keypoints:
            self.stdout.write(self.style.ERROR('No se pudieron extraer keypoints'))
            resultado = {'precision': 0, 'nota': 0, 'feedback': 'No se detectaron manos en el video', 'sena_detectada': 'error'}
            self.stdout.write(json.dumps(resultado))
            return

        self.stdout.write(f'Frames extraídos: {len(keypoints)}')
        self.stdout.write(f'Features por frame extraídos: {len(keypoints[0])}')
        
        # ===== VERIFICAR Y AJUSTAR DIMENSIONES =====
        features_extraidos = len(keypoints[0])
        
        if features_extraidos != n_features:
            self.stdout.write(self.style.WARNING(
                f'Inconsistencia: Extractor da {features_extraidos} features, '
                f'pero modelo espera {n_features} features'
            ))
            
            if features_extraidos < n_features:
                # Rellenar con ceros
                self.stdout.write(f'Rellenando con ceros a {n_features} features...')
                keypoints = [frame + [0.0] * (n_features - len(frame)) for frame in keypoints]
            else:
                # Truncar
                self.stdout.write(f'Truncando a {n_features} features...')
                keypoints = [frame[:n_features] for frame in keypoints]
        
        # Asegurar longitud de secuencia
        if len(keypoints) < seq_length:
            # Repetir el último frame si la secuencia es muy corta
            frames_faltantes = seq_length - len(keypoints)
            keypoints = keypoints + [keypoints[-1]] * frames_faltantes
            self.stdout.write(f'Secuencia extendida de {len(keypoints)-frames_faltantes} a {len(keypoints)} frames')
        else:
            # Tomar los primeros seq_length frames
            keypoints = keypoints[:seq_length]
            self.stdout.write(f'Usando primeros {seq_length} frames')

        # Normalizar cada frame
        secuencia_norm = []
        frames_error = 0
        
        for i, frame in enumerate(keypoints):
            try:
                # Asegurar que el frame tiene exactamente n_features
                if len(frame) != n_features:
                    if len(frame) < n_features:
                        frame = frame + [0.0] * (n_features - len(frame))
                    else:
                        frame = frame[:n_features]
                
                normalized = scaler.transform([frame])[0]
                secuencia_norm.append(normalized)
            except Exception as e:
                frames_error += 1
                # Usar ceros si falla la normalización
                secuencia_norm.append(np.zeros(n_features))
        
        if frames_error > 0:
            self.stdout.write(self.style.WARNING(f'Error normalizando {frames_error} frames, usando ceros'))
        
        # Preparar input para el modelo
        input_data = np.array(secuencia_norm).reshape(1, seq_length, n_features)
        
        # Predicción
        try:
            prediccion = model.predict(input_data, verbose=0)
            precision = float(prediccion[0][0]) * 100
            
            self.stdout.write(f'Predicción cruda: {prediccion[0][0]:.4f}')
            self.stdout.write(f'Precisión: {precision:.2f}%')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error en predicción: {e}'))
            resultado = {'precision': 0, 'nota': 0, 'feedback': f'Error en predicción: {str(e)}', 'sena_detectada': 'error'}
            self.stdout.write(json.dumps(resultado))
            return

        # Feedback
        if precision >= 70:
            feedback = f"Excelente! Precisión: {precision:.1f}%"
        elif precision >= 40:
            feedback = f"Buen intento! Precisión: {precision:.1f}%"
        else:
            feedback = f"Sigue practicando. Precisión: {precision:.1f}%"

        resultado = {
            'precision': round(precision, 2),
            'nota': round(precision / 20, 2),
            'feedback': feedback,
            'sena_detectada': 'seña',
            'frames_procesados': len(keypoints),
            'features_por_frame': n_features
        }

        self.stdout.write(json.dumps(resultado))

    def _extraer_keypoints(self, video_path):
        """Extrae keypoints del video - Siempre 225 features (99 pose + 63 right + 63 left)"""
        if not HAS_TASKS:
            print("MediaPipe no disponible")
            return []
        
        model_path_hand = 'models/hand_landmarker.task'
        model_path_pose = 'models/pose_landmarker.task'
        
        if not os.path.exists(model_path_hand):
            print(f"Modelo de manos no encontrado: {model_path_hand}")
            return []
        
        if not os.path.exists(model_path_pose):
            print(f"Modelo de pose no encontrado: {model_path_pose}")
            return []
        
        try:
            # Inicializar detectores
            base_options = python.BaseOptions
            
            hand_options = vision.HandLandmarkerOptions(
                base_options=base_options(model_asset_path=model_path_hand),
                num_hands=2,
                min_hand_detection_confidence=0.2,
                min_hand_presence_confidence=0.2,
                min_tracking_confidence=0.2,
                running_mode=vision.RunningMode.VIDEO
            )
            hand_detector = vision.HandLandmarker.create_from_options(hand_options)
            
            pose_options = vision.PoseLandmarkerOptions(
                base_options=base_options(model_asset_path=model_path_pose),
                running_mode=vision.RunningMode.VIDEO,
                num_poses=1,
                min_pose_detection_confidence=0.2,
                min_pose_presence_confidence=0.2,
                min_tracking_confidence=0.2
            )
            pose_detector = vision.PoseLandmarker.create_from_options(pose_options)
        except Exception as e:
            print(f"Error inicializando detectores: {e}")
            return []
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"No se pudo abrir el video: {video_path}")
            return []
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 30
        
        keypoints_frames = []
        timestamp_ms = 0
        frame_count = 0
        max_frames = 60
        
        while cap.isOpened() and frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Redimensionar para consistencia
            frame = cv2.resize(frame, (640, 480))
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            
            try:
                hand_results = hand_detector.detect_for_video(mp_image, timestamp_ms)
                pose_results = pose_detector.detect_for_video(mp_image, timestamp_ms)
            except Exception as e:
                print(f"Error detectando frame {frame_count}: {e}")
                hand_results = None
                pose_results = None
            
            # ===== EXTRACCIÓN CONSISTENTE: SIEMPRE 225 FEATURES =====
            features = []
            
            # 1. POSE: 33 landmarks × 3 = 99 features
            if pose_results and pose_results.pose_landmarks and len(pose_results.pose_landmarks) > 0:
                for lm in pose_results.pose_landmarks[0]:
                    features.extend([lm.x, lm.y, lm.z])
            else:
                features.extend([0.0] * 99)  # 33 puntos × 3 coordenadas
            
            # 2. MANO DERECHA: 21 landmarks × 3 = 63 features
            right_hand = [0.0] * 63
            if hand_results and hand_results.hand_landmarks:
                for idx, hand_lm in enumerate(hand_results.hand_landmarks):
                    if idx < len(hand_results.handedness):
                        if hand_results.handedness[idx][0].category_name == 'Right':
                            for i, lm in enumerate(hand_lm):
                                if i < 21:  # Solo 21 landmarks
                                    right_hand[i*3] = lm.x
                                    right_hand[i*3+1] = lm.y
                                    right_hand[i*3+2] = lm.z
            features.extend(right_hand)
            
            # 3. MANO IZQUIERDA: 21 landmarks × 3 = 63 features
            left_hand = [0.0] * 63
            if hand_results and hand_results.hand_landmarks:
                for idx, hand_lm in enumerate(hand_results.hand_landmarks):
                    if idx < len(hand_results.handedness):
                        if hand_results.handedness[idx][0].category_name == 'Left':
                            for i, lm in enumerate(hand_lm):
                                if i < 21:
                                    left_hand[i*3] = lm.x
                                    left_hand[i*3+1] = lm.y
                                    left_hand[i*3+2] = lm.z
            features.extend(left_hand)
            
            # Verificar dimensión (debe ser 99+63+63=225)
            if len(features) != 225:
                print(f"ADVERTENCIA: Frame {frame_count} tiene {len(features)} features (se esperaban 225)")
                if len(features) < 225:
                    features.extend([0.0] * (225 - len(features)))
                else:
                    features = features[:225]
            
            keypoints_frames.append(features)
            timestamp_ms += int(1000 / fps)
            frame_count += 1
        
        cap.release()
        try:
            hand_detector.close()
            pose_detector.close()
        except:
            pass
        
        print(f"Extraídos {len(keypoints_frames)} frames con {len(keypoints_frames[0]) if keypoints_frames else 0} features cada uno")
        return keypoints_frames