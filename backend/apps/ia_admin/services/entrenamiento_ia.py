# apps/ia_admin/services/entrenamiento_ia.py
import os
import subprocess
from django.conf import settings

class IATrainingService:
    """Servicio que ejecuta los comandos de ia-training desde el admin"""
    
    # Ruta al proyecto ia-training
    IA_TRAINING_PATH = "C:/LSB_2.0.0/ia-training"
    
    # Ruta al ejecutable de Python del entorno virtual
    PYTHON_EXECUTABLE = r"C:\LSB_2.0.0\ia-training\venv\Scripts\python.exe"
    
    @classmethod
    def entrenar_sena(cls, sena_id, sena_nombre, video_path):
        """
        Ejecuta el entrenamiento de una seña llamando a ia-training
        """
        # Ruta donde se guardará el modelo entrenado
        modelo_output = f"models/senas/sena_{sena_id}_modelo.h5"
        modelo_full_path = os.path.join(settings.BASE_DIR, modelo_output)
        
        # Crear directorio si no existe
        os.makedirs(os.path.dirname(modelo_full_path), exist_ok=True)
        
        # Ejecutar el comando train de ia-training
        result = subprocess.run([
            cls.PYTHON_EXECUTABLE,
            "manage.py", "train",
            "--video", video_path,
            "--output", modelo_full_path,
            "--nombre", sena_nombre,
            "--epochs", "30"
        ], capture_output=True, text=True, cwd=cls.IA_TRAINING_PATH)
        
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        
        if result.returncode == 0:
            return {
                'success': True,
                'modelo_ruta': modelo_output,
                'output': result.stdout
            }
        else:
            return {
                'success': False,
                'error': result.stderr
            }