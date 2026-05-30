from rest_framework import serializers
from .models import (
    Nivel, Unidad, Leccion, Sena, Ejercicio, 
    ProgresoUsuario, PuntosUsuario, IntentosEjercicio, ActividadUsuario, Logro, UsuarioLogro
)

class NivelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nivel
        fields = ['id', 'nombre']

class UnidadSerializer(serializers.ModelSerializer):
    progreso = serializers.SerializerMethodField()
    desbloqueada = serializers.SerializerMethodField()
    lecciones_completadas = serializers.SerializerMethodField()
    total_lecciones = serializers.SerializerMethodField()
    
    class Meta:
        model = Unidad
        fields = ['id', 'nivel', 'nombre', 'orden', 'progreso', 'desbloqueada', 
                  'lecciones_completadas', 'total_lecciones']
    
    def get_progreso(self, obj):
        request = self.context.get('request')
        if request:
            estudiante_id = request.query_params.get('estudiante_id')
            if estudiante_id:
                lecciones = Leccion.objects.filter(unidad=obj)
                lecciones_ids = lecciones.values_list('id', flat=True)
                completadas = ProgresoUsuario.objects.filter(
                    estudiante_id=estudiante_id,
                    leccion_id__in=lecciones_ids,
                    completado=True
                ).count()
                
                if lecciones.count() > 0:
                    return int((completadas / lecciones.count()) * 100)
        return 0
    
    def get_desbloqueada(self, obj):
        request = self.context.get('request')
        if request:
            estudiante_id = request.query_params.get('estudiante_id')
            if estudiante_id:
                # Primera unidad siempre desbloqueada
                if obj.orden == 1:
                    return True
                
                # Verificar si la unidad anterior está completada al 100%
                unidad_anterior = Unidad.objects.filter(
                    nivel_id=obj.nivel_id,
                    orden=obj.orden - 1
                ).first()
                
                if unidad_anterior:
                    lecciones_anterior = Leccion.objects.filter(unidad=unidad_anterior)
                    lecciones_ids = lecciones_anterior.values_list('id', flat=True)
                    completadas = ProgresoUsuario.objects.filter(
                        estudiante_id=estudiante_id,
                        leccion_id__in=lecciones_ids,
                        completado=True
                    ).count()
                    
                    return completadas == lecciones_anterior.count()
        return False
    
    def get_lecciones_completadas(self, obj):
        request = self.context.get('request')
        if request:
            estudiante_id = request.query_params.get('estudiante_id')
            if estudiante_id:
                lecciones = Leccion.objects.filter(unidad=obj)
                lecciones_ids = lecciones.values_list('id', flat=True)
                return ProgresoUsuario.objects.filter(
                    estudiante_id=estudiante_id,
                    leccion_id__in=lecciones_ids,
                    completado=True
                ).count()
        return 0
    
    def get_total_lecciones(self, obj):
        return Leccion.objects.filter(unidad=obj).count()

class LeccionSerializer(serializers.ModelSerializer):
    progreso = serializers.SerializerMethodField()
    desbloqueada = serializers.SerializerMethodField()
    
    class Meta:
        model = Leccion
        fields = ['id', 'unidad', 'titulo', 'orden', 'progreso', 'desbloqueada']
    
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

    def get_desbloqueada(self, obj):
        """Verificar si la lección está desbloqueada para el estudiante"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            estudiante_id = request.query_params.get('estudiante_id')
            if estudiante_id:
                # Primera lección siempre desbloqueada
                if obj.orden == 1:
                    # Verificar unidad anterior si existe
                    unidad_anterior = Unidad.objects.filter(
                        nivel_id=obj.unidad.nivel_id,
                        orden=obj.unidad.orden - 1
                    ).first()
                    
                    if unidad_anterior:
                        lecciones_anterior = Leccion.objects.filter(unidad=unidad_anterior)
                        completadas = ProgresoUsuario.objects.filter(
                            estudiante_id=estudiante_id,
                            leccion_id__in=lecciones_anterior.values_list('id', flat=True),
                            completado=True
                        ).count()
                        return completadas == lecciones_anterior.count()
                    return True
                
                # Verificar lección anterior
                leccion_anterior = Leccion.objects.filter(
                    unidad_id=obj.unidad_id,
                    orden=obj.orden - 1
                ).first()
                
                if leccion_anterior:
                    return ProgresoUsuario.objects.filter(
                        estudiante_id=estudiante_id,
                        leccion=leccion_anterior,
                        completado=True
                    ).exists()
        return False

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


class LogroSerializer(serializers.ModelSerializer):
    """Serializador para logros"""
    
    class Meta:
        model = Logro
        fields = ['id', 'nombre', 'descripcion', 'tipo', 'condicion_valor', 'imagen', 'puntos_recompensa']

class UsuarioLogroSerializer(serializers.ModelSerializer):
    logro_info = LogroSerializer(source='logro', read_only=True)
    estudiante_nombre = serializers.CharField(source='estudiante.usuario.nombre', read_only=True)
    
    class Meta:
        model = UsuarioLogro
        fields = ['id', 'estudiante', 'estudiante_nombre', 'logro', 'logro_info', 'fecha_desbloqueo']

class LogroConEstadoSerializer(serializers.Serializer):
    """Serializador para listar logros con estado de desbloqueo"""
    id = serializers.IntegerField()
    nombre = serializers.CharField()
    descripcion = serializers.CharField()
    imagen = serializers.CharField()
    desbloqueado = serializers.BooleanField()
    puntos_recompensa = serializers.IntegerField()
    fecha_desbloqueo = serializers.DateTimeField(required=False, allow_null=True)


class RespuestaCompletarLeccionSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    puntos_totales = serializers.IntegerField()
    racha_dias = serializers.IntegerField()
    logros_desbloqueados = LogroSerializer(many=True, required=False)
    siguiente_leccion = serializers.DictField(required=False, allow_null=True)
    siguiente_unidad = serializers.DictField(required=False, allow_null=True)
    siguiente_nivel = serializers.DictField(required=False, allow_null=True)


class RespuestaEvaluacionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    precision = serializers.FloatField()
    color = serializers.CharField()
    puntos_ganados = serializers.IntegerField()
    puntos_totales = serializers.IntegerField()
    feedback = serializers.DictField()