from rest_framework import serializers
from .models import (
    Nivel, Unidad, Leccion, Sena, Ejercicio, 
    ProgresoUsuario, PuntosUsuario, IntentosEjercicio, ActividadUsuario
)

class NivelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nivel
        fields = ['id', 'nombre']

class UnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidad
        fields = ['id', 'nivel', 'nombre', 'orden']

class LeccionSerializer(serializers.ModelSerializer):
    progreso = serializers.SerializerMethodField()
    
    class Meta:
        model = Leccion
        fields = ['id', 'unidad', 'titulo', 'orden', 'progreso']
    
    def get_progreso(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            estudiante_id = request.query_params.get('estudiante_id')
            if estudiante_id:
                progreso = ProgresoUsuario.objects.filter(
                    leccion=obj, 
                    estudiante_id=estudiante_id
                ).first()
                if progreso:
                    return {
                        'completado': progreso.completado,
                        'puntuacion': progreso.puntuacion,
                        'precision': float(progreso.precision) if progreso.precision else None
                    }
        return None

class SenaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sena
        fields = ['id', 'nombre', 'descripcion', 'video_url', 'modelo_referencia']

class EjercicioSerializer(serializers.ModelSerializer):
    sena_info = SenaSerializer(source='sena', read_only=True)
    
    class Meta:
        model = Ejercicio
        fields = [
            'id', 'leccion', 'tipo', 'nivel', 'pregunta', 
            'sena', 'sena_info', 'es_examen', 'metadata', 
            'modelo_referencia', 'tipo_modelo'
        ]

class ProgresoUsuarioSerializer(serializers.ModelSerializer):
    leccion_titulo = serializers.CharField(source='leccion.titulo', read_only=True)
    
    class Meta:
        model = ProgresoUsuario
        fields = ['id', 'estudiante', 'leccion', 'leccion_titulo', 'completado', 
                  'puntuacion', 'precision', 'intentos', 'tiempo_total', 'fecha']

class PuntosUsuarioSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.CharField(source='estudiante.usuario.nombre', read_only=True)
    
    class Meta:
        model = PuntosUsuario
        fields = ['id', 'estudiante', 'estudiante_nombre', 'puntos_totales', 'racha_dias', 'ultima_actividad']

class IntentosEjercicioSerializer(serializers.ModelSerializer):
    ejercicio_pregunta = serializers.CharField(source='ejercicio.pregunta', read_only=True)
    
    class Meta:
        model = IntentosEjercicio
        fields = ['id', 'estudiante', 'ejercicio', 'ejercicio_pregunta', 
                'puntuacion', 'precision', 'resultado_color', 'feedback', 'fecha']

class EvaluarEjercicioSerializer(serializers.Serializer):
    estudiante_id = serializers.IntegerField()
    ejercicio_id = serializers.IntegerField()
    keypoints = serializers.JSONField()