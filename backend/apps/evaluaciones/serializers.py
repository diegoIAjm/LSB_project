# apps/evaluaciones/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import (
    Evaluaciones, EvaluacionSenas, EntregasEvaluacion, 
    EntregasVideos, ResultadosVideo, EntregasResultados
)


class EvaluacionSenaSerializer(serializers.ModelSerializer):
    sena_nombre = serializers.SerializerMethodField()

    class Meta:
        model = EvaluacionSenas
        fields = ['id', 'evaluacion_id', 'sena_id', 'sena_nombre', 'orden', 'puntos_maximos']

    def get_sena_nombre(self, obj):
        from duolingo.models import Sena
        try:
            sena = Sena.objects.get(id=obj.sena_id)
            return sena.nombre
        except:
            return f"Seña {obj.sena_id}"


class EvaluacionSerializer(serializers.ModelSerializer):
    senas = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    senas_detalle = EvaluacionSenaSerializer(source='senas', many=True, read_only=True)
    curso_nombre = serializers.SerializerMethodField()
    leccion_titulo = serializers.SerializerMethodField()
    is_vencida = serializers.SerializerMethodField()
    tiempo_restante = serializers.SerializerMethodField()

    class Meta:
        model = Evaluaciones
        fields = [
            'id', 'curso_id', 'docente_id', 'leccion_id', 'titulo',
            'descripcion', 'fecha_creacion', 'fecha_limite', 'estado',
            'tiempo_estimado_minutos', 'reintentos_permitidos',
            'senas', 'senas_detalle', 'curso_nombre', 'leccion_titulo',
            'is_vencida', 'tiempo_restante'
        ]
        read_only_fields = ['fecha_creacion']

    def get_curso_nombre(self, obj):
        from cursos.models import Curso
        try:
            curso = Curso.objects.get(id=obj.curso_id)
            return curso.nombre
        except:
            return f"Curso {obj.curso_id}"

    def get_leccion_titulo(self, obj):
        from duolingo.models import Leccion
        try:
            leccion = Leccion.objects.get(id=obj.leccion_id)
            return leccion.titulo
        except:
            return f"Lección {obj.leccion_id}"

    def get_is_vencida(self, obj):
        """Calcula si la evaluación está vencida"""
        from django.utils import timezone as tz
        
        if tz.is_naive(obj.fecha_limite):
            fecha_limite = tz.make_aware(obj.fecha_limite)
        else:
            fecha_limite = obj.fecha_limite
        
        return tz.now() > fecha_limite

    def get_tiempo_restante(self, obj):
        from django.utils import timezone as tz
        
        if tz.is_naive(obj.fecha_limite):
            fecha_limite = tz.make_aware(obj.fecha_limite)
        else:
            fecha_limite = obj.fecha_limite
        
        ahora = tz.now()
        if fecha_limite > ahora:
            diff = fecha_limite - ahora
            dias = diff.days
            horas = diff.seconds // 3600
            if dias > 0:
                return f"{dias} día(s)"
            elif horas > 0:
                return f"{horas} hora(s)"
            return "Menos de 1 hora"
        return "Vencida"


class ResultadoVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultadosVideo
        fields = ['id', 'precision', 'puntuacion', 'color', 'sena_detectada', 'feedback', 'fecha_evaluacion']


class EntregaVideoSerializer(serializers.ModelSerializer):
    resultado = ResultadoVideoSerializer(read_only=True)
    sena_nombre = serializers.SerializerMethodField()
    video_file = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = EntregasVideos
        fields = ['id', 'evaluacion_sena_id', 'sena_id', 'sena_nombre', 
                'video_url', 'video_file', 'orden', 'fecha_subida', 'resultado']

    def get_sena_nombre(self, obj):
        from duolingo.models import Sena
        try:
            sena = Sena.objects.get(id=obj.sena_id)
            return sena.nombre
        except:
            return f"Seña {obj.sena_id}"


class EntregaEvaluacionSerializer(serializers.ModelSerializer):
    videos = EntregaVideoSerializer(many=True, read_only=True)
    resumen = serializers.SerializerMethodField()
    estudiante_nombre = serializers.SerializerMethodField()
    puede_entregar = serializers.SerializerMethodField()
    tiempo_restante = serializers.SerializerMethodField()
    reintentos_permitidos = serializers.SerializerMethodField()

    class Meta:
        model = EntregasEvaluacion
        fields = [
            'id', 'evaluacion_id', 'estudiante_id', 'estado', 'intentos',  # ✅ Un solo 'intentos'
            'fecha_inicio', 'fecha_entrega', 'nota_final',
            'videos', 'resumen', 'estudiante_nombre', 'puede_entregar',
            'tiempo_restante', 'reintentos_permitidos'
        ]

    def get_reintentos_permitidos(self, obj):
        return obj.evaluacion.reintentos_permitidos

    def get_estudiante_nombre(self, obj):
        from usuarios.models import Estudiante
        try:
            estudiante = Estudiante.objects.get(id=obj.estudiante_id)
            return f"{estudiante.usuario.nombre} {estudiante.usuario.apellido}"
        except:
            return f"Estudiante {obj.estudiante_id}"

    def get_resumen(self, obj):
        try:
            resumen = obj.resumen
            return {
                'nota_total': float(resumen.nota_total) if resumen.nota_total else None,
                'precision_promedio': float(resumen.precision_promedio) if resumen.precision_promedio else None,
                'videos_aprobados': resumen.videos_aprobados,
                'videos_total': resumen.videos_total
            }
        except:
            return None

    def get_puede_entregar(self, obj):
        """Verifica si el estudiante puede entregar la práctica"""
        from django.utils import timezone as tz
        
        if tz.is_naive(obj.evaluacion.fecha_limite):
            fecha_limite = tz.make_aware(obj.evaluacion.fecha_limite)
        else:
            fecha_limite = obj.evaluacion.fecha_limite
        
        is_vencida = tz.now() > fecha_limite
        
        if is_vencida:
            return False
        if obj.estado in ['completado', 'revisado']:
            return False
        return True

    def get_tiempo_restante(self, obj):
        from django.utils import timezone as tz
        
        if tz.is_naive(obj.evaluacion.fecha_limite):
            fecha_limite = tz.make_aware(obj.evaluacion.fecha_limite)
        else:
            fecha_limite = obj.evaluacion.fecha_limite
        
        ahora = tz.now()
        if fecha_limite > ahora:
            diff = fecha_limite - ahora
            dias = diff.days
            horas = diff.seconds // 3600
            if dias > 0:
                return f"{dias} día(s)"
            elif horas > 0:
                return f"{horas} hora(s)"
            return "Menos de 1 hora"
        return "Vencida"


class CrearEntregaVideoSerializer(serializers.Serializer):
    evaluacion_id = serializers.IntegerField()
    estudiante_id = serializers.IntegerField()
    sena_id = serializers.IntegerField()
    video_file = serializers.FileField()


class CompletarEntregaSerializer(serializers.Serializer):
    entrega_id = serializers.IntegerField()