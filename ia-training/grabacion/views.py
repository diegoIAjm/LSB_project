from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
import os
import base64
from django.conf import settings

def grabacion_view(request):
    """Vista principal para grabación con MediaPipe"""
    return render(request, 'grabacion/index.html')

@csrf_exempt
def guardar_video(request):
    """Guardar video grabado y extraer frames"""
    if request.method == 'POST':
        data = json.loads(request.body)
        video_data = data.get('video', '')
        nombre = data.get('nombre', 'seña')
        
        # Decodificar base64
        if video_data.startswith('data:video'):
            video_data = video_data.split(',')[1]
        
        video_bytes = base64.b64decode(video_data)
        
        # Guardar video
        video_dir = os.path.join(settings.BASE_DIR, 'data', 'raw')
        os.makedirs(video_dir, exist_ok=True)
        
        video_path = os.path.join(video_dir, f'{nombre}.webm')
        with open(video_path, 'wb') as f:
            f.write(video_bytes)
        
        return JsonResponse({'success': True, 'path': video_path})
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)

# 🔹 NUEVO: Guardar keypoints directamente
@csrf_exempt
def guardar_keypoints(request):
    """Guardar keypoints capturados en tiempo real"""
    if request.method == 'POST':
        data = json.loads(request.body)
        keypoints = data.get('keypoints', [])
        nombre = data.get('nombre', 'seña')
        
        if not keypoints:
            return JsonResponse({'error': 'No hay keypoints para guardar'}, status=400)
        
        # Guardar keypoints
        keypoints_dir = os.path.join(settings.BASE_DIR, 'data', 'keypoints')
        os.makedirs(keypoints_dir, exist_ok=True)
        
        keypoints_path = os.path.join(keypoints_dir, f'{nombre}.json')
        with open(keypoints_path, 'w') as f:
            json.dump(keypoints, f, indent=2)
        
        return JsonResponse({'success': True, 'path': keypoints_path, 'frames': len(keypoints)})
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)