# duolingo/views_ia.py
import os
import cv2
import numpy as np
import joblib
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from tensorflow.keras.models import load_model
from apps.senas.models import Senas
from django.conf import settings
from django.utils import timezone

# Importar modelos de duolingo
from duolingo.models import ProgresoUsuario, ActividadUsuario, PuntosUsuario, IntentosEjercicio
from duolingo.models import Ejercicio

# Configuración de MediaPipe
try:
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    import mediapipe as mp
    MP_AVAILABLE = True
except ImportError:
    MP_AVAILABLE = False

def extraer_keypoints(video_path):
    """Extrae keypoints del video usando MediaPipe"""
    if not MP_AVAILABLE:
        return []
    
    model_path_hand = 'models/hand_landmarker.task'
    model_path_pose = 'models/pose_landmarker.task'
    
    if not os.path.exists(model_path_hand) or not os.path.exists(model_path_pose):
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
    keypoints_frames = []
    timestamp_ms = 0
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = cv2.resize(frame, (640, 480))
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        
        hand_results = hand_detector.detect_for_video(mp_image, timestamp_ms)
        pose_results = pose_detector.detect_for_video(mp_image, timestamp_ms)
        
        features = []
        
        # Pose (99)
        if pose_results and pose_results.pose_landmarks:
            for lm in pose_results.pose_landmarks[0]:
                features.extend([lm.x, lm.y, lm.z])
        else:
            features.extend([0.0] * 99)
        
        # Mano derecha (63)
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
        
        # Mano izquierda (63)
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
        
        keypoints_frames.append(features)
        timestamp_ms += int(1000 / fps)
    
    cap.release()
    hand_detector.close()
    pose_detector.close()
    
    return keypoints_frames

@api_view(['POST'])
def evaluar_sena_duolingo(request):
    print("=== INICIO EVALUACIÓN ===")
    print(f"Datos recibidos: {request.data.keys() if request.data else 'None'}")
    print(f"Archivos: {request.FILES.keys() if request.FILES else 'None'}")
    
    try:
        sena_id = request.data.get('sena_id')
        video_file = request.FILES.get('video')
        usuario_id = request.data.get('estudiante_id')
        
        print(f"sena_id: {sena_id}")
        print(f"video_file: {video_file.name if video_file else 'None'}")
        print(f"usuario_id: {usuario_id}")
        
        if not sena_id or not video_file:
            return Response({'error': 'Faltan sena_id o video'}, status=400)
        
        try:
            sena_id = int(sena_id)
            if usuario_id:
                usuario_id = int(usuario_id)
        except ValueError as e:
            print(f"Error de conversión: {e}")
            return Response({'error': 'IDs deben ser números'}, status=400)
        
        # ========== CONVERTIR usuario_id A estudiante_id ==========
        estudiante_id = None
        try:
            from usuarios.models import Estudiante
            estudiante = Estudiante.objects.filter(usuario_id=usuario_id).first()
            if estudiante:
                estudiante_id = estudiante.id
                print(f"Usuario ID: {usuario_id} -> Estudiante ID: {estudiante_id}")
            else:
                print(f"No se encontró estudiante para usuario_id: {usuario_id}")
                estudiante_id = usuario_id
        except Exception as e:
            print(f"Error obteniendo estudiante: {e}")
            estudiante_id = usuario_id
        
        # Obtener la seña
        sena = Senas.objects.get(id=sena_id)
        print(f"Seña encontrada: {sena.nombre}, modelo: {sena.modelo_ruta}")
        
        if not sena.modelo_ruta:
            return Response({'error': f'La seña "{sena.nombre}" no tiene modelo entrenado'}, status=400)
        
        # Obtener el ejercicio
        try:
            from duolingo.models import Ejercicio
            ejercicio = Ejercicio.objects.filter(sena=sena_id).first()
            print(f"Ejercicio encontrado: {ejercicio.id if ejercicio else 'None'}")
        except Exception as e:
            print(f"Error obteniendo ejercicio: {e}")
            ejercicio = None
        
        # Guardar video
        temp_path = default_storage.save(f'temp/duolingo_{sena_id}_{estudiante_id}.mp4', ContentFile(video_file.read()))
        video_full_path = default_storage.path(temp_path)
        print(f"Video guardado en: {video_full_path}")
        
        # Extraer keypoints
        print("Extrayendo keypoints...")
        keypoints = extraer_keypoints(video_full_path)
        print(f"Keypoints extraídos: {len(keypoints) if keypoints else 0} frames")
        
        if not keypoints:
            default_storage.delete(temp_path)
            return Response({
                'precision': 0,
                'color': 'rojo',
                'puntos_ganados': 0,
                'feedback': 'No se detectaron manos en el video',
                'sena_detectada': 'error',
                'detalles': {'mano': 'rojo', 'movimiento': 'rojo'}
            })
        
        # Cargar modelo
        modelo_full_path = os.path.join(settings.BASE_DIR, sena.modelo_ruta)
        scaler_path = modelo_full_path.replace('.h5', '_scaler.pkl')
        print(f"Cargando modelo: {modelo_full_path}")
        print(f"Cargando scaler: {scaler_path}")
        
        model = load_model(modelo_full_path)
        scaler = joblib.load(scaler_path)
        
        # Preparar datos
        seq_length = 30
        n_features = 225
        
        if len(keypoints) < seq_length:
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
        
        # Predecir
        input_data = np.array(secuencia_norm).reshape(1, seq_length, n_features)
        prediccion = model.predict(input_data, verbose=0)
        precision = float(prediccion[0][0]) * 100
        print(f"Precisión: {precision}%")
        
        # Calcular puntos
        if precision >= 70:
            color = 'verde'
            puntos_ganados = 20
            completado = True
            feedback = f'¡Excelente! Precisión: {precision:.1f}%'
        elif precision >= 40:
            color = 'amarillo'
            puntos_ganados = 10
            completado = False
            feedback = f'Buen intento. Precisión: {precision:.1f}%'
        else:
            color = 'rojo'
            puntos_ganados = 0
            completado = False
            feedback = f'Sigue practicando. Precisión: {precision:.1f}%'
        
        # ========== REGISTRAR EN TODAS LAS TABLAS ==========
        from duolingo.models import IntentosEjercicio, ProgresoUsuario, ActividadUsuario, PuntosUsuario
        from django.utils import timezone
        
        # 1. Registrar intento del ejercicio
        if ejercicio:
            IntentosEjercicio.objects.create(
                estudiante_id=estudiante_id,
                ejercicio_id=ejercicio.id,
                puntuacion=puntos_ganados,
                precision=round(precision, 2),
                resultado_color=color,
                feedback={'mensaje': feedback},
                keypoints={'precision': precision}
            )
            print("✅ Intento registrado")
            
            # 2. Actualizar progreso del usuario
            progreso, created = ProgresoUsuario.objects.get_or_create(
                estudiante_id=estudiante_id,
                leccion_id=ejercicio.leccion_id,
                defaults={
                    'completado': completado,
                    'puntuacion': puntos_ganados,
                    'precision': round(precision, 2),
                    'intentos': 1,
                    'tiempo_total': 0
                }
            )
            
            if not created:
                progreso.intentos += 1
                if completado and not progreso.completado:
                    progreso.completado = True
                if puntos_ganados > progreso.puntuacion:
                    progreso.puntuacion = puntos_ganados
                if precision > (progreso.precision or 0):
                    progreso.precision = round(precision, 2)
                progreso.save()
            
            print(f"✅ Progreso actualizado (Lección {ejercicio.leccion_id})")
        
        # 3. Registrar actividad del usuario
        ActividadUsuario.objects.create(
            estudiante_id=estudiante_id,
            modulo='duolingo',
            accion=f'ejercicio_{color}_prec_{int(precision)}'
        )
        print("✅ Actividad registrada")
        
        # 4. Actualizar puntos totales
        puntos, created = PuntosUsuario.objects.get_or_create(
            estudiante_id=estudiante_id,
            defaults={
                'puntos_totales': puntos_ganados,
                'racha_dias': 0,
                'ultima_actividad': timezone.now()
            }
        )
        
        if not created:
            puntos.puntos_totales += puntos_ganados
            puntos.ultima_actividad = timezone.now()
            puntos.save()
        
        print(f"✅ Puntos actualizados: +{puntos_ganados} (Total: {puntos.puntos_totales})")
        
        # Limpiar archivo temporal
        default_storage.delete(temp_path)
        
        response_data = {
            'precision': round(precision, 2),
            'color': color,
            'puntos_ganados': puntos_ganados,
            'puntos_totales': puntos.puntos_totales,
            'feedback': feedback,
            'sena_detectada': sena.nombre,
            'detalles': {
                'mano': color,
                'movimiento': color
            }
        }
        
        print("=== EVALUACIÓN COMPLETADA ===")
        return Response(response_data)
        
    except Exception as e:
        print(f"=== ERROR EN EVALUACIÓN ===")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'precision': 0,
            'color': 'rojo',
            'puntos_ganados': 0,
            'puntos_totales': 0,
            'feedback': f'Error: {str(e)[:100]}',
            'sena_detectada': 'error',
            'detalles': {'mano': 'rojo', 'movimiento': 'rojo'}
        })