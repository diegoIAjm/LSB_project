# apps/ia_admin/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .services.entrenamiento_ia import IATrainingService
from apps.senas.models import Senas

@api_view(['POST'])
#@permission_classes([IsAdminUser])
def entrenar_sena_admin(request):
    """
    Vista para que el ADMIN entrene una seña desde el panel de admin
    POST /api/ia-admin/entrenar/
    Body: form-data con sena_id, video
    """
    sena_id = request.data.get('sena_id')
    video = request.FILES.get('video')
    
    if not sena_id or not video:
        return Response({'error': 'Faltan sena_id o video'}, status=400)
    
    try:
        sena = Senas.objects.get(id=sena_id)
    except Senas.DoesNotExist:
        return Response({'error': 'Seña no encontrada'}, status=404)
    
    # Guardar video temporal
    temp_path = default_storage.save(f'temp/entrenamiento_{sena_id}.mp4', ContentFile(video.read()))
    video_full_path = default_storage.path(temp_path)
    
    # Entrenar
    resultado = IATrainingService.entrenar_sena(
        sena_id=sena_id,
        sena_nombre=sena.nombre,
        video_path=video_full_path
    )
    
    # Limpiar
    default_storage.delete(temp_path)
    
    if resultado['success']:
        # Actualizar la ruta del modelo en la tabla senas
        sena.modelo_ruta = resultado['modelo_ruta']
        sena.save()
        
        return Response({
            'message': f'✅ Modelo para la seña "{sena.nombre}" entrenado correctamente',
            'sena_id': sena_id,
            'sena_nombre': sena.nombre,
            'modelo_ruta': resultado['modelo_ruta']
        })
    else:
        return Response({'error': resultado['error']}, status=500)