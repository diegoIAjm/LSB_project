from rest_framework import serializers
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.StringRelatedField()  # 🔹 usa el __str__ del rol

    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido', 'email', 'rol', 'foto', 'estado', 'fecha_registro']