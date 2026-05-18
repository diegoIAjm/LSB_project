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
    video_file = serializers.FileField(write_only=True, required=False)
    resultado = serializers.DictField(read_only=True)

    class Meta:
        model = EntregasEvaluacion
        fields = [
            'id', 'evaluacion_id', 'estudiante_id', 'video_url',
            'estado', 'fecha_entrega', 'estudiante_nombre', 
            'estudiante_apellido', 'video_file', 'resultado'
        ]

    def get_estudiante_nombre(self, obj):
        # Aquí puedes conectar con tu modelo de estudiantes
        return f"Estudiante {obj.estudiante_id}"

    def get_estudiante_apellido(self, obj):
        return ""

    def create(self, validated_data):
        video_file = validated_data.pop('video_file', None)
        entrega = super().create(validated_data)
        
        if video_file:
            # Guardar video
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            import os
            
            extension = os.path.splitext(video_file.name)[1]
            path = f'entregas/evaluacion_{entrega.evaluacion_id}_estudiante_{entrega.estudiante_id}_{entrega.id}{extension}'
            saved_path = default_storage.save(path, ContentFile(video_file.read()))
            entrega.video_url = saved_path
            entrega.save()
        
        return entrega


class ResultadoEvaluacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultadosEvaluacion
        fields = ['id', 'entrega_id', 'fecha_revision', 'nota', 'precision', 'observaciones']