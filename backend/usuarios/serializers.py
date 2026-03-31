from rest_framework import serializers
from .models import Usuario
from django.contrib.auth.hashers import make_password
import re 
from django.utils import timezone

# 🔹 Serializador para listar usuarios
class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.StringRelatedField()  # usa el __str__ del rol

    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido', 'email', 'rol', 'foto', 'estado', 'fecha_registro']

# 🔹 Serializador para crear usuarios
class UsuarioCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido', 'email', 'password', 'rol', 'estado', 'fecha_registro']

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