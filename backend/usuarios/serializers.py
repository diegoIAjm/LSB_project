from rest_framework import serializers
from .models import Usuario, Rol, Docente, Estudiante
from django.contrib.auth.hashers import make_password
import re 
from django.utils import timezone

# 🔹 Serializador para listar usuarios
class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.StringRelatedField()  # usa el __str__ del rol
    nivel_actual = serializers.SerializerMethodField()
    especialidad = serializers.SerializerMethodField()


    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido', 'email', 'ci', 'rol', 'foto', 'estado', 'fecha_registro', 'nivel_actual', 'especialidad']

    def get_nivel_actual(self, obj):
        try:
            if hasattr(obj, 'estudiante') and obj.estudiante:
                return obj.estudiante.nivel_actual
        except:
            pass
        return None

    def get_especialidad(self, obj):
        try:
            if hasattr(obj, 'docente') and obj.docente:
                return obj.docente.especialidad
        except:
            pass
        return None

class UsuarioCreateSerializer(serializers.ModelSerializer):
    nivel_actual = serializers.CharField(required=False, allow_null=True, write_only=True)
    especialidad = serializers.CharField(required=False, allow_null=True, write_only=True)
    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido', 'email', 'ci', 'password', 'rol', 'estado', 'fecha_registro', 'nivel_actual', 'especialidad']

    def validate_nombre(self, value):
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$', value):
            raise serializers.ValidationError("El nombre debe tener solo letras y entre 2 y 50 caracteres")
        return value

    def validate_apellido(self, value):
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$', value):
            raise serializers.ValidationError("El apellido debe tener solo letras y entre 2 y 50 caracteres")
        return value

    def validate_email(self, value):
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', value):
            raise serializers.ValidationError("Ingrese un correo electrónico válido")
        return value
    
    def validate_ci(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("El CI es obligatorio")
        if not re.match(r'^[0-9]{5,15}$', value):
            raise serializers.ValidationError("El CI debe contener solo números y entre 5 y 15 dígitos")
        # 🔹 Validar CI único
        if Usuario.objects.filter(ci=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este CI")
        return value

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("La contraseña debe tener al menos 6 caracteres")
        return make_password(value)

    def create(self, validated_data):
        nivel_actual = validated_data.pop('nivel_actual', None)
        especialidad = validated_data.pop('especialidad', None)
        
        if 'estado' not in validated_data:
            validated_data['estado'] = 'activo'
        validated_data['fecha_registro'] = timezone.now()
        
        usuario = super().create(validated_data)
        
        # Crear registro en estudiante o docente según el rol
        rol = validated_data.get('rol')
        rol_id = rol.id if rol else None
        
        if rol_id == 3:  # Estudiante
            Estudiante.objects.create(usuario=usuario, nivel_actual=nivel_actual or 'Principiante')
        elif rol_id == 2:  # Docente
            Docente.objects.create(usuario=usuario, especialidad=especialidad or 'General')
        
        return usuario

class UsuarioUpdateSerializer(serializers.ModelSerializer):
    # 🔹 Campo rol como ID (entero)
    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all())
    nivel_actual = serializers.CharField(required=False, allow_null=True, write_only=True)
    especialidad = serializers.CharField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido', 'email', 'ci', 'rol', 'nivel_actual', 'especialidad']

    def validate_nombre(self, value):
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$', value):
            raise serializers.ValidationError("El nombre debe tener solo letras y entre 2 y 50 caracteres")
        return value

    def validate_apellido(self, value):
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$', value):
            raise serializers.ValidationError("El apellido debe tener solo letras y entre 2 y 50 caracteres")
        return value

    def validate_email(self, value):
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', value):
            raise serializers.ValidationError("Ingrese un correo electrónico válido")
        return value
    
    def validate_ci(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("El CI es obligatorio")
        if not re.match(r'^[0-9]{5,15}$', value):
            raise serializers.ValidationError("El CI debe contener solo números y entre 5 y 15 dígitos")
        return value

    def validate(self, data):
        email = data.get('email')
        ci = data.get('ci')
        usuario_actual = self.instance
        
        if email and Usuario.objects.filter(email=email).exclude(id=usuario_actual.id).exists():
            raise serializers.ValidationError({"email": "Ya existe un usuario con este correo electrónico"})
        
        if ci and Usuario.objects.filter(ci=ci).exclude(id=usuario_actual.id).exists():
            raise serializers.ValidationError({"ci": "Ya existe un usuario con este CI"})
        
        return data
    
    def update(self, instance, validated_data):
        nivel_actual = validated_data.pop('nivel_actual', None)
        especialidad = validated_data.pop('especialidad', None)
        
        # Actualizar campos del usuario
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar datos específicos según el rol
        rol_id = instance.rol.id if instance.rol else None
        
        if rol_id == 3:  # Estudiante
            estudiante, created = Estudiante.objects.get_or_create(usuario=instance)
            if nivel_actual is not None:
                estudiante.nivel_actual = nivel_actual
            estudiante.save()
        elif rol_id == 2:  # Docente
            docente, created = Docente.objects.get_or_create(usuario=instance)
            if especialidad is not None:
                docente.especialidad = especialidad
            docente.save()
        
        return instance

class ImportacionResponseSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    creados = serializers.IntegerField()
    duplicados = serializers.ListField(child=serializers.DictField(), required=False)
    errores = serializers.ListField(child=serializers.DictField())
    detalle = serializers.ListField(child=serializers.DictField())