import cv2
import json
import os
import numpy as np
from django.core.management.base import BaseCommand

try:
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    import mediapipe as mp
    HAS_TASKS = True
except Exception as e:
    HAS_TASKS = False
    mp = None
    print(f"Error importing MediaPipe: {e}")

class Command(BaseCommand):
    help = 'Extrae keypoints de un video (manos + pose)'

    def add_arguments(self, parser):
        parser.add_argument('--video', type=str, required=True)
        parser.add_argument('--output', type=str, required=True)
        parser.add_argument('--max-frames', type=int, default=60, help='Máximo de frames a procesar')
        parser.add_argument('--confianza', type=float, default=0.2, help='Umbral de confianza para detección')
        parser.add_argument('--solo-detectados', action='store_true', help='Guardar solo frames con manos detectadas')
        parser.add_argument('--debug-video', action='store_true', help='Guardar video con anotaciones para debug')
        parser.add_argument('--resize', type=float, default=0.8, help='Factor de redimensionamiento')
        parser.add_argument('--detectar-pose', action='store_true', help='Detectar también landmarks de pose')

    def handle(self, *args, **options):
        video_path = options['video']
        output_path = options['output']
        max_frames = options['max_frames']
        confianza = options['confianza']
        solo_detectados = options['solo_detectados']
        debug_video = options['debug_video']
        resize_factor = options['resize']
        detectar_pose = options['detectar_pose']

        self.stdout.write(f'Procesando: {video_path}')
        self.stdout.write(f'   Umbral de confianza: {confianza}')
        self.stdout.write(f'   Factor de redimensionamiento: {resize_factor}')
        self.stdout.write(f'   Detectar pose: {"Sí" if detectar_pose else "No"}')
        self.stdout.write(f'   Features por frame: 225 (99 pose + 63 mano derecha + 63 mano izquierda)')

        if not os.path.exists(video_path):
            self.stdout.write(self.style.ERROR(f'Video no encontrado: {video_path}'))
            return

        if not HAS_TASKS:
            self.stdout.write(self.style.ERROR('mediapipe.tasks no está disponible'))
            return

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            self.stdout.write(self.style.ERROR(f'No se pudo abrir el video'))
            return

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        original_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        original_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        new_width = int(original_width * resize_factor)
        new_height = int(original_height * resize_factor)
        
        self.stdout.write(f'   FPS: {fps}, Total frames: {total_frames}')
        self.stdout.write(f'   Resolución: {original_width}x{original_height} -> {new_width}x{new_height}')

        # Verificar modelo de manos
        model_path = 'models/hand_landmarker.task'
        if not os.path.exists(model_path):
            self.stdout.write(self.style.ERROR(f'Modelo no encontrado: {model_path}'))
            self.stdout.write('   Descarga: https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task')
            cap.release()
            return

        # Crear detector de manos
        base_options = python.BaseOptions(model_asset_path=model_path)
        hand_options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=2,
            min_hand_detection_confidence=confianza,
            min_hand_presence_confidence=confianza,
            min_tracking_confidence=confianza,
            running_mode=vision.RunningMode.VIDEO
        )
        hand_detector = vision.HandLandmarker.create_from_options(hand_options)

        # Crear detector de pose si es necesario
        pose_detector = None
        if detectar_pose:
            pose_model_path = 'models/pose_landmarker.task'
            if not os.path.exists(pose_model_path):
                self.stdout.write(f'   Descargando modelo de pose...')
                import urllib.request
                url = 'https://storage.googleapis.com/mediapipe-assets/pose_landmarker.task'
                urllib.request.urlretrieve(url, pose_model_path)
                self.stdout.write(f'   Modelo de pose descargado')
            
            pose_options = vision.PoseLandmarkerOptions(
                base_options=python.BaseOptions(model_asset_path=pose_model_path),
                running_mode=vision.RunningMode.VIDEO,
                num_poses=1,
                min_pose_detection_confidence=confianza,
                min_pose_presence_confidence=confianza,
                min_tracking_confidence=confianza
            )
            pose_detector = vision.PoseLandmarker.create_from_options(pose_options)
            self.stdout.write('   Detector de pose inicializado')

        # Configurar video de debug
        debug_writer = None
        debug_output_path = None
        if debug_video:
            debug_output_path = output_path.replace('.json', '_debug.mp4')
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            debug_writer = cv2.VideoWriter(debug_output_path, fourcc, fps, (new_width, new_height))
            self.stdout.write(f'   Guardando video debug: {debug_output_path}')

        keypoints = []
        processed_frames = 0
        max_frames = min(max_frames, total_frames) if total_frames > 0 else max_frames
        
        detecciones_manos = 0
        detecciones_pose = 0
        timestamp_ms = 0

        while cap.isOpened() and processed_frames < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            if resize_factor != 1.0:
                frame = cv2.resize(frame, (new_width, new_height))
            
            # Mejorar contraste para mejor detección
            lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            l = clahe.apply(l)
            lab = cv2.merge([l, a, b])
            frame_mejorado = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

            frame_rgb = cv2.cvtColor(frame_mejorado, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            
            # Detectar manos
            hand_results = hand_detector.detect_for_video(mp_image, timestamp_ms)
            
            # Detectar pose si está habilitado
            pose_results = None
            if pose_detector:
                pose_results = pose_detector.detect_for_video(mp_image, timestamp_ms)
            
            timestamp_ms += int(1000 / fps)

            # ===== INICIALIZAR ARRAYS CON DIMENSIONES CORRECTAS =====
            # 33 landmarks de pose × 3 coordenadas = 99 features
            pose_landmarks = [0.0] * 99
            # 21 landmarks de mano × 3 coordenadas = 63 features
            right_hand = [0.0] * 63
            left_hand = [0.0] * 63

            deteccion_frame = False
            frame_annotated = None

            # ========== PROCESAR MANOS ==========
            if hand_results.hand_landmarks and len(hand_results.hand_landmarks) > 0:
                deteccion_frame = True
                detecciones_manos += 1
                
                if debug_video:
                    frame_annotated = frame_mejorado.copy()
                
                for hand_idx, hand_landmarks in enumerate(hand_results.hand_landmarks):
                    # Extraer puntos (21 landmarks x 3 = 63)
                    points = []
                    for lm in hand_landmarks:
                        points.extend([lm.x, lm.y, lm.z])
                    
                    # Verificar que tenemos al menos 63 puntos
                    if len(points) >= 63:
                        points = points[:63]  # Tomar solo los primeros 63
                        
                        # Determinar si es derecha o izquierda
                        handedness = None
                        if hand_results.handedness and hand_idx < len(hand_results.handedness) and len(hand_results.handedness[hand_idx]) > 0:
                            handedness = hand_results.handedness[hand_idx][0].category_name
                        
                        # Método alternativo: por posición X
                        if handedness is None:
                            wrist_x = points[0]
                            handedness = 'Right' if wrist_x > 0.5 else 'Left'
                        
                        # Asignar a la mano correspondiente
                        if handedness == 'Right':
                            right_hand = points
                            if processed_frames % 10 == 0:
                                self.stdout.write(f'   Frame {processed_frames}: Mano DERECHA detectada', ending='')
                        else:
                            left_hand = points
                            if processed_frames % 10 == 0:
                                self.stdout.write(f'   Frame {processed_frames}: Mano IZQUIERDA detectada', ending='')
                        
                        # Dibujar en frame de debug
                        if debug_video and frame_annotated is not None:
                            for lm in hand_landmarks:
                                x = int(lm.x * new_width)
                                y = int(lm.y * new_height)
                                cv2.circle(frame_annotated, (x, y), 3, (0, 255, 0), -1)
                            
                            # Conexiones de la mano
                            connections = [
                                (0,1), (1,2), (2,3), (3,4),  # Pulgar
                                (0,5), (5,6), (6,7), (7,8),  # Índice
                                (0,9), (9,10), (10,11), (11,12),  # Medio
                                (0,13), (13,14), (14,15), (15,16),  # Anular
                                (0,17), (17,18), (18,19), (19,20)  # Meñique
                            ]
                            for connection in connections:
                                if connection[0] < len(hand_landmarks) and connection[1] < len(hand_landmarks):
                                    x1 = int(hand_landmarks[connection[0]].x * new_width)
                                    y1 = int(hand_landmarks[connection[0]].y * new_height)
                                    x2 = int(hand_landmarks[connection[1]].x * new_width)
                                    y2 = int(hand_landmarks[connection[1]].y * new_height)
                                    cv2.line(frame_annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)

            # ========== PROCESAR POSE ==========
            if pose_results and pose_results.pose_landmarks and len(pose_results.pose_landmarks) > 0:
                deteccion_frame = True
                detecciones_pose += 1
                
                # Extraer pose landmarks (33 puntos)
                for i, lm in enumerate(pose_results.pose_landmarks[0]):
                    if i < 33:
                        pose_landmarks[i*3] = lm.x
                        pose_landmarks[i*3+1] = lm.y
                        pose_landmarks[i*3+2] = lm.z
                
                # Dibujar pose en debug
                if debug_video and frame_annotated is not None:
                    puntos_importantes = [11, 12, 13, 14, 15, 16, 23, 24]
                    for idx in puntos_importantes:
                        if idx < len(pose_results.pose_landmarks[0]):
                            lm = pose_results.pose_landmarks[0][idx]
                            x = int(lm.x * new_width)
                            y = int(lm.y * new_height)
                            cv2.circle(frame_annotated, (x, y), 5, (255, 0, 0), -1)
                    
                    brazos = [(11, 13), (13, 15), (12, 14), (14, 16)]
                    for conn in brazos:
                        if conn[0] < len(pose_results.pose_landmarks[0]) and conn[1] < len(pose_results.pose_landmarks[0]):
                            lm1 = pose_results.pose_landmarks[0][conn[0]]
                            lm2 = pose_results.pose_landmarks[0][conn[1]]
                            x1, y1 = int(lm1.x * new_width), int(lm1.y * new_height)
                            x2, y2 = int(lm2.x * new_width), int(lm2.y * new_height)
                            cv2.line(frame_annotated, (x1, y1), (x2, y2), (255, 0, 0), 3)

            # ===== CONCATENAR FEATURES =====
            # Orden: POSE (99) + RIGHT_HAND (63) + LEFT_HAND (63) = TOTAL 225
            features = pose_landmarks + right_hand + left_hand
            
            # VALIDACIÓN: Asegurar que siempre sean 225 características
            if len(features) != 225:
                self.stdout.write(self.style.WARNING(
                    f'Frame {processed_frames}: {len(features)} features (se esperaban 225) - Corrigiendo...'
                ))
                if len(features) < 225:
                    features.extend([0.0] * (225 - len(features)))
                else:
                    features = features[:225]

            # Guardar frame de debug
            if debug_video:
                if frame_annotated is not None:
                    debug_writer.write(frame_annotated)
                else:
                    debug_writer.write(frame_mejorado)

            # Guardar datos del frame
            if not solo_detectados or deteccion_frame:
                keypoints.append({
                    'frame': processed_frames,
                    'features': features,  # ← NUEVO: Lista plana de 225 características
                    'pose': pose_landmarks,
                    'right_hand': right_hand,
                    'left_hand': left_hand,
                    'deteccion_manos': hand_results.hand_landmarks is not None and len(hand_results.hand_landmarks) > 0,
                    'deteccion_pose': pose_results is not None and pose_results.pose_landmarks is not None and len(pose_results.pose_landmarks) > 0,
                    'timestamp_ms': timestamp_ms
                })

            processed_frames += 1
            
            # Mostrar progreso
            has_right = any(v != 0 for v in right_hand[:3])
            has_left = any(v != 0 for v in left_hand[:3])
            has_pose = detectar_pose and any(v != 0 for v in pose_landmarks[:3])
            status = f'\r   Frame {processed_frames}/{max_frames} - R:{1 if has_right else 0} L:{1 if has_left else 0} Pose:{1 if has_pose else 0}'
            self.stdout.write(status, ending='')

        cap.release()
        hand_detector.close()
        if pose_detector:
            pose_detector.close()
        
        if debug_writer:
            debug_writer.release()

        self.stdout.write('')
        self.stdout.write(f'   Frames procesados: {processed_frames}/{max_frames}')
        
        # Estadísticas
        frames_con_derecha = sum(1 for f in keypoints if any(v != 0 for v in f['right_hand'][:3]))
        frames_con_izquierda = sum(1 for f in keypoints if any(v != 0 for v in f['left_hand'][:3]))
        frames_con_pose = sum(1 for f in keypoints if f.get('deteccion_pose', False))
        
        self.stdout.write(f'   Frames con mano derecha: {frames_con_derecha}/{processed_frames}')
        self.stdout.write(f'   Frames con mano izquierda: {frames_con_izquierda}/{processed_frames}')
        if detectar_pose:
            self.stdout.write(f'   Frames con pose: {frames_con_pose}/{processed_frames}')
        
        # Verificar que todos los frames tengan 225 features
        features_valid = all(len(f.get('features', [])) == 225 for f in keypoints)
        if features_valid:
            self.stdout.write(self.style.SUCCESS(f'   [OK] Todos los frames tienen 225 features'))
        else:
            self.stdout.write(self.style.WARNING(f'   [WARN] Algunos frames no tienen 225 features'))

        # Guardar JSON
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(keypoints, f, indent=2)

        self.stdout.write(self.style.SUCCESS(f'\nGuardado: {output_path}'))
        
        if debug_video and debug_output_path:
            self.stdout.write(self.style.SUCCESS(f'Video debug guardado: {debug_output_path}'))