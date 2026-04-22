from rest_framework import serializers
from .models import Curso, Inscripcion
from usuarios.models import Docente, Usuario, Estudiante

class DocenteSimpleSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    nombre = serializers.SerializerMethodField()
    apellido = serializers.SerializerMethodField()
    
    class Meta:
        model = Docente
        fields = ['id', 'nombre_completo', 'nombre', 'apellido', 'especialidad']
    
    def get_nombre_completo(self, obj):
        if obj.usuario:
            return f"{obj.usuario.nombre} {obj.usuario.apellido}"
        return 'Sin nombre'
    
    def get_nombre(self, obj):
        return obj.usuario.nombre if obj.usuario else ''
    
    def get_apellido(self, obj):
        return obj.usuario.apellido if obj.usuario else ''

class CursoSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.SerializerMethodField()
    docente_info = DocenteSimpleSerializer(source='docente', read_only=True)
    duracion_meses = serializers.SerializerMethodField()
    
    class Meta:
        model = Curso
        fields = [
            'id', 'nombre', 'nivel', 'modalidad', 'fecha_inicio', 'fecha_fin', 
            'estado', 'docente', 'docente_nombre', 'docente_info', 
            'duracion_meses', 'created_at', 'updated_at'
        ]
    
    def get_docente_nombre(self, obj):
        if obj.docente and obj.docente.usuario:
            return f"{obj.docente.usuario.nombre} {obj.docente.usuario.apellido}"
        return 'No asignado'
    
    def get_duracion_meses(self, obj):
        if obj.fecha_inicio and obj.fecha_fin:
            diff = obj.fecha_fin - obj.fecha_inicio
            return diff.days // 30  # Aproximado en meses
        return 0

class CursoCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = ['nombre', 'nivel', 'modalidad', 'fecha_inicio', 'fecha_fin', 'estado', 'docente']
    
    def validate(self, data):
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')
        
        if fecha_inicio and fecha_fin and fecha_fin < fecha_inicio:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha de fin no puede ser menor a la fecha de inicio'
            })
        
        # Validar que la duración sea de aproximadamente 4 meses
        if fecha_inicio and fecha_fin:
            diff_days = (fecha_fin - fecha_inicio).days
            if diff_days < 90 or diff_days > 150:
                raise serializers.ValidationError({
                    'fechas': 'El curso debe tener una duración aproximada de 4 meses (90-150 días)'
                })
        
        return data

class CursoDisponibleSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Curso
        fields = ['id', 'nombre', 'nivel', 'modalidad', 'fecha_inicio', 'fecha_fin', 'docente_nombre']  # 🔹 Añadido modalidad
    
    def get_docente_nombre(self, obj):
        if obj.docente and obj.docente.usuario:
            return f"{obj.docente.usuario.nombre} {obj.docente.usuario.apellido}"
        return 'No asignado'
    
class EstudianteSimpleSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    nivel = serializers.CharField(source='nivel_actual')
    
    class Meta:
        model = Estudiante
        fields = ['id', 'nombre_completo', 'nivel']
    
    def get_nombre_completo(self, obj):
        return f"{obj.usuario.nombre} {obj.usuario.apellido}"

class CursoDisponibleSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Curso
        fields = ['id', 'nombre', 'nivel', 'fecha_inicio', 'fecha_fin', 'docente_nombre']
    
    def get_docente_nombre(self, obj):
        if obj.docente and obj.docente.usuario:
            return f"{obj.docente.usuario.nombre} {obj.docente.usuario.apellido}"
        return 'No asignado'

class InscripcionSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.SerializerMethodField()
    curso_nombre = serializers.SerializerMethodField()
    curso_nivel = serializers.CharField(source='curso.nivel')
    fecha_inscripcion_formateada = serializers.SerializerMethodField()
    
    class Meta:
        model = Inscripcion
        fields = ['id', 'estudiante', 'estudiante_nombre', 'curso', 'curso_nombre', 
            'curso_nivel', 'fecha_inscripcion', 'fecha_inscripcion_formateada', 'estado']
    
    def get_estudiante_nombre(self, obj):
        return f"{obj.estudiante.usuario.nombre} {obj.estudiante.usuario.apellido}"
    
    def get_curso_nombre(self, obj):
        return obj.curso.nombre
    
    def get_fecha_inscripcion_formateada(self, obj):
        return obj.fecha_inscripcion.strftime('%d/%m/%Y %H:%M')

class InscripcionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inscripcion
        fields = ['estudiante', 'curso']
    
    def validate(self, data):
        estudiante = data.get('estudiante')
        curso = data.get('curso')
        
        # Verificar si ya existe inscripción activa
        if Inscripcion.objects.filter(estudiante=estudiante, curso=curso, estado='activo').exists():
            raise serializers.ValidationError("El estudiante ya está inscrito en este curso")
        
        return data