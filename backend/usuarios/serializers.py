from rest_framework import serializers
from .models import Usuario, Rol
from django.contrib.auth.hashers import make_password
import re 
from django.utils import timezone

# 🔹 Serializador para listar usuarios
class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.StringRelatedField()  # usa el __str__ del rol

    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido', 'email', 'ci', 'rol', 'foto', 'estado', 'fecha_registro']

# 🔹 Serializador para crear usuarios
class UsuarioCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido', 'email', 'ci', 'password', 'rol', 'estado', 'fecha_registro']

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
        # 🔹 Estado por defecto
        if 'estado' not in validated_data:
            validated_data['estado'] = 'activo'
        # 🔹 Fecha de registro actual
        validated_data['fecha_registro'] = timezone.now()
        return super().create(validated_data)

class UsuarioUpdateSerializer(serializers.ModelSerializer):
    # 🔹 Campo rol como ID (entero)
    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all())
    
    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido', 'email', 'ci', 'rol']

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

    def validate(self, data):
        email = data.get('email')
        usuario_actual = self.instance
        
        if email and Usuario.objects.filter(email=email).exclude(id=usuario_actual.id).exists():
            raise serializers.ValidationError({"email": "Ya existe un usuario con este correo electrónico"})
        
        return data
    
        if ci and Usuario.objects.filter(ci=ci).exclude(id=usuario_actual.id).exists():
            raise serializers.ValidationError({"ci": "Ya existe un usuario con este CI"})
    
        return data
    
    # Añade al final del archivo

class ImportacionResponseSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    creados = serializers.IntegerField()
    duplicados = serializers.ListField(child=serializers.DictField(), required=False)
    errores = serializers.ListField(child=serializers.DictField())
    detalle = serializers.ListField(child=serializers.DictField())