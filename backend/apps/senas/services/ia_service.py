# apps/senas/services/ia_service.py
import os
import subprocess
import json
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

class IASenaService:
    """
    Servicio para comunicarse con el microservicio de IA (ia-training)
    """
    
    # Ruta al proyecto de IA
    IA_PROJECT_PATH = "C:/LSB_2.0.0/ia-training"
    
    @classmethod
    def entrenar_sena(cls, sena_id, sena_nombre, video_file):
        """
        Entrena un modelo para una seña específica
        Args:
            sena_id: ID de la seña
            sena_nombre: Nombre de la seña (ej: 'A', 'B', 'HOLA')
            video_file: Archivo de video subido
        Returns:
            dict: Resultado del entrenamiento
        """
        # Guardar video temporalmente
        temp_video_path = default_storage.save(
            f'temp/sena_{sena_id}_entrenamiento.mp4', 
            ContentFile(video_file.read())
        )
        video_full_path = default_storage.path(temp_video_path)
        
        # Ruta donde se guardará el modelo
        modelo_ruta = f'models/senas/sena_{sena_id}_modelo.h5'
        modelo_full_path = os.path.join(settings.BASE_DIR, modelo_ruta)
        
        # Asegurar que el directorio existe
        os.makedirs(os.path.dirname(modelo_full_path), exist_ok=True)
        
        # Ejecutar entrenamiento en ia-training
        result = subprocess.run([
            "python", "manage.py", "train",
            "--video", video_full_path,
            "--output", modelo_full_path,
            "--nombre", sena_nombre,
            "--epochs", "50"
        ], capture_output=True, text=True, cwd=cls.IA_PROJECT_PATH)
        
        # Limpiar archivo temporal
        default_storage.delete(temp_video_path)
        
        if result.returncode == 0:
            return {
                'success': True,
                'modelo_ruta': modelo_ruta,
                'output': result.stdout
            }
        else:
            return {
                'success': False,
                'error': result.stderr
            }
    
    @classmethod
    def evaluar_sena(cls, sena_id, video_file):
        """
        Evalúa un video del estudiante contra el modelo de la seña
        Args:
            sena_id: ID de la seña a evaluar
            video_file: Video del estudiante (archivo subido)
        Returns:
            dict: Resultado de la evaluación (precisión, feedback, nota)
        """
        from apps.senas.models import Senas
        
        # Obtener la seña y su modelo
        try:
            sena = Senas.objects.get(id=sena_id)
        except Senas.DoesNotExist:
            return {
                'success': False,
                'error': f'Seña con ID {sena_id} no encontrada'
            }
        
        if not sena.modelo_ruta:
            return {
                'success': False,
                'error': f'La seña "{sena.nombre}" no tiene modelo entrenado'
            }
        
        # Guardar video temporal
        temp_video_path = default_storage.save(
            f'temp/eval_sena_{sena_id}.mp4', 
            ContentFile(video_file.read())
        )
        video_full_path = default_storage.path(temp_video_path)
        
        # Rutas del modelo
        modelo_full_path = os.path.join(settings.BASE_DIR, sena.modelo_ruta)
        scaler_ruta = modelo_full_path.replace('.h5', '_scaler.pkl')
        
        # Verificar que el modelo existe
        if not os.path.exists(modelo_full_path):
            default_storage.delete(temp_video_path)
            return {
                'success': False,
                'error': f'Modelo no encontrado: {sena.modelo_ruta}'
            }
        
        # Ejecutar evaluación en ia-training
        result = subprocess.run([
            "python", "manage.py", "evaluar",
            "--video", video_full_path,
            "--modelo", modelo_full_path,
            "--scaler", scaler_ruta
        ], capture_output=True, text=True, cwd=cls.IA_PROJECT_PATH)
        
        # Limpiar archivo temporal
        default_storage.delete(temp_video_path)
        
        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                return {
                    'precision': 0,
                    'nota': 0,
                    'feedback': 'Error al procesar el resultado',
                    'sena_detectada': 'error'
                }
        else:
            return {
                'precision': 0,
                'nota': 0,
                'feedback': f'Error en IA: {result.stderr[:200]}',
                'sena_detectada': 'error'
            }
    
    @classmethod
    def evaluar_video_estudiante(cls, video_path, sena_id):
        """
        Evalúa un video ya guardado en el servidor
        Usado para evaluaciones del docente
        """
        from apps.senas.models import Senas
        
        try:
            sena = Senas.objects.get(id=sena_id)
        except Senas.DoesNotExist:
            return {
                'success': False,
                'error': f'Seña con ID {sena_id} no encontrada'
            }
        
        if not sena.modelo_ruta:
            return {
                'success': False,
                'error': f'La seña "{sena.nombre}" no tiene modelo entrenado'
            }
        
        modelo_full_path = os.path.join(settings.BASE_DIR, sena.modelo_ruta)
        scaler_ruta = modelo_full_path.replace('.h5', '_scaler.pkl')
        
        result = subprocess.run([
            "python", "manage.py", "evaluar",
            "--video", video_path,
            "--modelo", modelo_full_path,
            "--scaler", scaler_ruta
        ], capture_output=True, text=True, cwd=cls.IA_PROJECT_PATH)
        
        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except:
                return {'precision': 0, 'feedback': 'Error al procesar'}
        else:
            return {'precision': 0, 'feedback': result.stderr}