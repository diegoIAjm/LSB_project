# apps/evaluaciones/services/evaluacion_ia_service.py
import os
import subprocess
import json
from django.conf import settings

class EvaluacionIAService:
    """Servicio que conecta el backend con la IA de ia-training"""
    
    IA_PROJECT_PATH = "C:/LSB_2.0.0/ia-training"  # Ruta a tu proyecto IA
    
    @classmethod
    def evaluar_entrega(cls, entrega_id):
        """
        Evalúa una entrega del estudiante
        La IA sabe qué señas evaluar porque lee de evaluacion_senas
        """
        from apps.evaluaciones.models import EntregasEvaluacion, EvaluacionSenas, ResultadosEvaluacion
        from apps.senas.models import Senas
        
        # 1. Obtener la entrega
        entrega = EntregasEvaluacion.objects.get(id=entrega_id)
        
        # 2. Obtener TODAS las señas que debe hacer el estudiante
        senas_a_evaluar = EvaluacionSenas.objects.filter(
            evaluacion_id=entrega.evaluacion_id
        ).order_by('orden')
        
        if not senas_a_evaluar.exists():
            raise Exception("No hay señas asociadas a esta evaluación")
        
        # 3. Procesar el video del estudiante
        video_path = os.path.join(settings.MEDIA_ROOT, entrega.video_url)
        
        # 4. Evaluar cada seña
        resultados_por_sena = []
        precision_total = 0
        
        for idx, eval_sena in enumerate(senas_a_evaluar):
            # Obtener la seña y su modelo entrenado
            sena = Senas.objects.get(id=eval_sena.sena_id)
            
            # Evaluar esta seña específica
            resultado = cls._evaluar_sena_en_video(
                video_path, 
                sena.nombre,
                sena.modelo_ruta
            )
            
            resultados_por_sena.append({
                'orden': eval_sena.orden,
                'sena_nombre': sena.nombre,
                'precision': resultado['precision'],
                'feedback': resultado['feedback']
            })
            
            precision_total += resultado['precision']
        
        # 5. Calcular nota final (promedio de todas las señas)
        nota_final = (precision_total / len(senas_a_evaluar)) / 20  # 0-5
        precision_final = precision_total / len(senas_a_evaluar)
        
        # 6. Guardar resultado
        resultado_obj = ResultadosEvaluacion.objects.create(
            entrega_id=entrega_id,
            fecha_revision=timezone.now(),
            nota=round(nota_final, 2),
            precision=round(precision_final, 2),
            observaciones=json.dumps(resultados_por_sena)
        )
        
        # 7. Actualizar estado de la entrega
        entrega.estado = 'revisado'
        entrega.save()
        
        return {
            'success': True,
            'precision_total': round(precision_final, 2),
            'nota': round(nota_final, 2),
            'senas_evaluadas': len(senas_a_evaluar),
            'detalle': resultados_por_sena
        }
    
    @classmethod
    def _evaluar_sena_en_video(cls, video_path, sena_nombre, modelo_ruta):
        """
        Llama al microservicio de IA para evaluar una seña específica
        """
        if not modelo_ruta or not os.path.exists(modelo_ruta):
            return {
                'precision': 0,
                'feedback': f'Modelo para la seña "{sena_nombre}" no encontrado'
            }
        
        # Obtener ruta completa del modelo
        modelo_completo = os.path.join(settings.BASE_DIR, modelo_ruta)
        scaler_ruta = modelo_completo.replace('.h5', '_scaler.pkl')
        
        # Ejecutar el comando evaluar de ia-training
        result = subprocess.run([
            "python", "manage.py", "evaluar",
            "--video", video_path,
            "--modelo", modelo_completo,
            "--scaler", scaler_ruta
        ], capture_output=True, text=True, cwd=cls.IA_PROJECT_PATH)
        
        try:
            return json.loads(result.stdout)
        except:
            return {
                'precision': 0,
                'feedback': f'Error al evaluar la seña {sena_nombre}'
            }