# apps/evaluaciones/services/evaluacion_ia_service.py

import os
import cv2
import numpy as np
import joblib
from django.conf import settings
from django.utils import timezone
from ..models import EntregasVideos, ResultadosVideo, EntregasEvaluacion, EntregasResultados

# Importar tensorflow de manera segura
try:
    from tensorflow.keras.models import load_model
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("TensorFlow no disponible, la evaluación usará valores simulados")


def extraer_keypoints(video_path):
    """
    Extrae keypoints del video usando MediaPipe
    Mismo código que en duolingo/views_ia.py
    """
    try:
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision
        import mediapipe as mp
        
        model_path_hand = os.path.join(settings.BASE_DIR, 'models/hand_landmarker.task')
        model_path_pose = os.path.join(settings.BASE_DIR, 'models/pose_landmarker.task')
        
        if not os.path.exists(model_path_hand) or not os.path.exists(model_path_pose):
            print(f"Modelos no encontrados: hand={os.path.exists(model_path_hand)}, pose={os.path.exists(model_path_pose)}")
            return []
        
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
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"No se pudo abrir el video: {video_path}")
            return []
        
        keypoints_frames = []
        timestamp_ms = 0
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 30
        
        frame_count = 0
        max_frames = 60
        
        while cap.isOpened() and frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
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
            
            features = []
            
            # 1. POSE: 33 landmarks × 3 = 99 features
            if pose_results and pose_results.pose_landmarks and len(pose_results.pose_landmarks) > 0:
                for lm in pose_results.pose_landmarks[0]:
                    features.extend([lm.x, lm.y, lm.z])
            else:
                features.extend([0.0] * 99)
            
            # 2. MANO DERECHA: 21 landmarks × 3 = 63 features
            right_hand = [0.0] * 63
            if hand_results and hand_results.hand_landmarks:
                for idx, hand_lm in enumerate(hand_results.hand_landmarks):
                    if idx < len(hand_results.handedness):
                        if hand_results.handedness[idx][0].category_name == 'Right':
                            for i, lm in enumerate(hand_lm):
                                if i < 21:
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
            
            # Verificar dimensión
            if len(features) != 225:
                if len(features) < 225:
                    features.extend([0.0] * (225 - len(features)))
                else:
                    features = features[:225]
            
            keypoints_frames.append(features)
            timestamp_ms += int(1000 / fps)
            frame_count += 1
        
        cap.release()
        hand_detector.close()
        pose_detector.close()
        
        print(f"Extraídos {len(keypoints_frames)} frames")
        return keypoints_frames
        
    except Exception as e:
        print(f"Error extrayendo keypoints: {e}")
        import traceback
        traceback.print_exc()
        return []


class EvaluacionIAService:
    """
    Servicio para evaluar prácticas de estudiantes
    Usa el mismo método que Duolingo: carga el modelo .h5 directamente
    """
    
    @classmethod
    def evaluar_video_entrega(cls, video_id):
        """
        Evalúa un video específico de una entrega
        """
        try:
            video = EntregasVideos.objects.get(id=video_id)
        except EntregasVideos.DoesNotExist:
            return {
                'success': False,
                'error': 'Video no encontrado'
            }
        
        # Verificar si ya fue evaluado
        resultado_existente = ResultadosVideo.objects.filter(entrega_video=video).first()
        if resultado_existente:
            return {
                'success': True,
                'ya_evaluado': True,
                'resultado': {
                    'precision': float(resultado_existente.precision) if resultado_existente.precision else 0,
                    'puntuacion': resultado_existente.puntuacion,
                    'color': resultado_existente.color,
                    'feedback': resultado_existente.feedback
                }
            }
        
        # Obtener la seña
        from apps.senas.models import Senas
        try:
            sena = Senas.objects.get(id=video.sena_id)
        except Senas.DoesNotExist:
            return {
                'success': False,
                'error': f'Seña con ID {video.sena_id} no encontrada'
            }
        
        if not sena.modelo_ruta:
            return {
                'success': False,
                'error': f'La seña "{sena.nombre}" no tiene modelo entrenado'
            }
        
        # Ruta del video
        video_path = os.path.join(settings.MEDIA_ROOT, video.video_url)
        
        if not os.path.exists(video_path):
            return {
                'success': False,
                'error': f'Archivo de video no encontrado: {video_path}'
            }
        
        print(f"=== EVALUANDO VIDEO ===")
        print(f"Video: {video_path}")
        print(f"Seña: {sena.nombre}")
        
        # ========== EXTRAER KEYPOINTS ==========
        keypoints = extraer_keypoints(video_path)
        
        if not keypoints:
            return cls._resultado_error("No se detectaron manos en el video")
        
        print(f"Keypoints extraídos: {len(keypoints)} frames")
        
        # ========== CARGAR MODELO Y SCALER ==========
        modelo_path = os.path.join(settings.BASE_DIR, sena.modelo_ruta)
        scaler_path = modelo_path.replace('.h5', '_scaler.pkl')
        
        if not os.path.exists(modelo_path):
            return cls._resultado_error(f"Modelo no encontrado: {modelo_path}")
        
        if not os.path.exists(scaler_path):
            return cls._resultado_error(f"Scaler no encontrado: {scaler_path}")
        
        print(f"Cargando modelo: {modelo_path}")
        print(f"Cargando scaler: {scaler_path}")
        
        if not TF_AVAILABLE:
            print("TensorFlow no disponible, usando simulación")
            return cls._resultado_simulacion()
        
        try:
            model = load_model(modelo_path)
            scaler = joblib.load(scaler_path)
        except Exception as e:
            return cls._resultado_error(f"Error cargando modelo: {str(e)}")
        
        # ========== PREPARAR DATOS ==========
        seq_length = 30
        n_features = 225
        
        if len(keypoints) < seq_length:
            # Repetir el último frame
            keypoints = keypoints + [keypoints[-1]] * (seq_length - len(keypoints))
        else:
            keypoints = keypoints[:seq_length]
        
        secuencia_norm = []
        for i, frame in enumerate(keypoints):
            if len(frame) < n_features:
                frame = frame + [0.0] * (n_features - len(frame))
            else:
                frame = frame[:n_features]
            
            try:
                normalized = scaler.transform([frame])[0]
                secuencia_norm.append(normalized)
            except Exception as e:
                print(f"Error normalizando frame {i}: {e}")
                secuencia_norm.append([0.0] * n_features)
        
        # ========== PREDECIR ==========
        input_data = np.array(secuencia_norm).reshape(1, seq_length, n_features)
        
        try:
            prediccion = model.predict(input_data, verbose=0)
            precision = float(prediccion[0][0]) * 100
            print(f"Precisión: {precision:.2f}%")
        except Exception as e:
            return cls._resultado_error(f"Error en predicción: {str(e)}")
        
        # ========== CALCULAR RESULTADO ==========
        if precision >= 70:
            color = 'verde'
            puntuacion = int(precision)
        elif precision >= 40:
            color = 'amarillo'
            puntuacion = int(precision * 0.8)
        else:
            color = 'rojo'
            puntuacion = int(precision * 0.5)
        
        # ✅ USAR update_or_create PARA EVITAR DUPLICADOS
        resultado, created = ResultadosVideo.objects.update_or_create(
            entrega_video=video,
            defaults={
                'precision': round(precision, 2),
                'puntuacion': puntuacion,
                'color': color,
                'sena_detectada': sena.nombre,
                'feedback': {
                    'mano': color,
                    'movimiento': color
                }
            }
        )
        
        if created:
            print(f"✅ Nuevo resultado creado para video {video_id}")
        else:
            print(f"🔄 Resultado actualizado para video {video_id}")
        
        return {
            'success': True,
            'resultado': {
                'precision': round(precision, 2),
                'puntuacion': puntuacion,
                'color': color,
                'sena_detectada': sena.nombre,
                'feedback': {'mano': color, 'movimiento': color}
            }
        }
    
    @classmethod
    def _resultado_error(cls, mensaje):
        """Retorna un resultado de error"""
        return {
            'success': True,
            'resultado': {
                'precision': 0,
                'puntuacion': 0,
                'color': 'rojo',
                'sena_detectada': 'error',
                'feedback': {'mano': 'rojo', 'movimiento': 'rojo', 'error': mensaje}
            }
        }
    
    @classmethod
    def _resultado_simulacion(cls):
        """Retorna un resultado simulado (para pruebas sin TensorFlow)"""
        import random
        precision = random.randint(50, 95)
        
        if precision >= 70:
            color = 'verde'
            puntuacion = int(precision)
        elif precision >= 40:
            color = 'amarillo'
            puntuacion = int(precision * 0.8)
        else:
            color = 'rojo'
            puntuacion = int(precision * 0.5)
        
        return {
            'success': True,
            'resultado': {
                'precision': round(precision, 2),
                'puntuacion': puntuacion,
                'color': color,
                'sena_detectada': 'simulada',
                'feedback': {'mano': color, 'movimiento': color}
            }
        }
    
    @classmethod
    def evaluar_toda_entrega(cls, entrega_id):
        """Evalúa todos los videos pendientes de una entrega"""
        try:
            entrega = EntregasEvaluacion.objects.get(id=entrega_id)
        except EntregasEvaluacion.DoesNotExist:
            return {'success': False, 'error': 'Entrega no encontrada'}
        
        videos = EntregasVideos.objects.filter(entrega=entrega)
        resultados = []
        
        for video in videos:
            resultado_existente = ResultadosVideo.objects.filter(entrega_video=video).first()
            if not resultado_existente:
                resultado = cls.evaluar_video_entrega(video.id)
                if resultado.get('success'):
                    resultado_existente = ResultadosVideo.objects.filter(entrega_video=video).first()
            
            if resultado_existente:
                resultados.append({
                    'sena_id': video.sena_id,
                    'precision': float(resultado_existente.precision) if resultado_existente.precision else 0,
                    'puntuacion': resultado_existente.puntuacion,
                    'color': resultado_existente.color
                })
        
        if not resultados:
            return {'success': False, 'error': 'No hay videos para evaluar'}
        
        total_puntuacion = sum(r['puntuacion'] for r in resultados)
        total_senas = len(resultados)
        nota_total = (total_puntuacion / (total_senas * 100)) * 20
        precision_promedio = sum(r['precision'] for r in resultados) / total_senas
        videos_aprobados = sum(1 for r in resultados if r['precision'] >= 70)
        
        entrega.estado = 'revisado'
        entrega.nota_final = nota_total
        entrega.save()
        
        EntregasResultados.objects.update_or_create(
            entrega=entrega,
            defaults={
                'nota_total': nota_total,
                'precision_promedio': precision_promedio,
                'videos_aprobados': videos_aprobados,
                'videos_total': total_senas,
                'feedback_general': f"Práctica completada. {videos_aprobados}/{total_senas} señas aprobadas."
            }
        )
        
        return {
            'success': True,
            'entrega_id': entrega.id,
            'nota_total': float(nota_total),
            'precision_promedio': float(precision_promedio),
            'videos_aprobados': videos_aprobados,
            'videos_total': total_senas
        }