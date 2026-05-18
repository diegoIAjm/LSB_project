# test_simple.py
import cv2
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import mediapipe as mp

# Crear detector de manos
model_path = 'models/hand_landmarker.task'
base_options = python.BaseOptions(model_asset_path=model_path)
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=2,
    min_hand_detection_confidence=0.2,
    min_hand_presence_confidence=0.2,
    min_tracking_confidence=0.2
)
detector = vision.HandLandmarker.create_from_options(options)

# Probar con cámara web
cap = cv2.VideoCapture(0)  # 0 para cámara web

if not cap.isOpened():
    print("No se pudo abrir la cámara")
    exit()

print("Presiona 'q' para salir. Muestra tu mano frente a la cámara.")

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # Voltear para espejo
    frame = cv2.flip(frame, 1)
    height, width = frame.shape[:2]
    
    # Convertir a RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    
    # Detectar manos
    results = detector.detect(mp_image)
    
    # Dibujar resultados
    if results.hand_landmarks:
        print(f"✅ Manos detectadas: {len(results.hand_landmarks)}")
        for hand_landmarks in results.hand_landmarks:
            for lm in hand_landmarks:
                x = int(lm.x * width)
                y = int(lm.y * height)
                cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
    
    cv2.imshow('Test Manos', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
detector.close()
cv2.destroyAllWindows()