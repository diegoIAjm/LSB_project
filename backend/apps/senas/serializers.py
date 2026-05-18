# apps/senas/serializers.py
from rest_framework import serializers
from .models import Senas, CategoriasSenas

class CategoriaSenaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriasSenas
        fields = ['id', 'nombre']


class SenaSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria_id', read_only=True)
    
    class Meta:
        model = Senas
        fields = ['id', 'nombre', 'descripcion', 'categoria_id', 'categoria_nombre', 'video_url', 'modelo_ruta']