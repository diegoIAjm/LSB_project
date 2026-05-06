# apps/evaluaciones/serializers.py

from rest_framework import serializers
from .models import Evaluaciones, EvaluacionSenas, EntregasEvaluacion, ResultadosEvaluacion


class EvaluacionSenaSerializer(serializers.ModelSerializer):
    sena_nombre = serializers.CharField(source='sena_id', read_only=True)  # Ajustar según tu modelo de señas

    class Meta:
        model = EvaluacionSenas
        fields = ['id', 'evaluacion_id', 'sena_nombre', 'orden']


class EvaluacionSerializer(serializers.ModelSerializer):
    senas_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    curso_nombre = serializers.SerializerMethodField()
    leccion_titulo = serializers.SerializerMethodField()

    class Meta:
        model = Evaluaciones
        fields = [
            'id', 'curso_id', 'docente_id', 'leccion_id', 'titulo',
            'descripcion', 'fecha_creacion', 'fecha_limite',
            'senas_ids', 'curso_nombre', 'leccion_titulo'
        ]
        read_only_fields = ['fecha_creacion']

    def get_curso_nombre(self, obj):
        # Aquí harías un query al app de cursos
        return f"Curso {obj.curso_id}"

    def get_leccion_titulo(self, obj):
        return f"Lección {obj.leccion_id}"


class EntregaEvaluacionSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.SerializerMethodField()
    estudiante_apellido = serializers.SerializerMethodField()

    class Meta:
        model = EntregasEvaluacion
        fields = [
            'id', 'evaluacion_id', 'estudiante_id', 'video_url',
            'estado', 'fecha_entrega', 'estudiante_nombre', 'estudiante_apellido'
        ]

    def get_estudiante_nombre(self, obj):
        return f"Estudiante {obj.estudiante_id}"

    def get_estudiante_apellido(self, obj):
        return ""


class ResultadoEvaluacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultadosEvaluacion
        fields = ['id', 'entrega_id', 'fecha_revision', 'nota', 'precision', 'observaciones']