from rest_framework import serializers
from .models import Material

class MaterialSerializer(serializers.ModelSerializer):
    curso_nombre = serializers.CharField(source='curso.nombre', read_only=True)
    fecha_formateada = serializers.SerializerMethodField()
    archivo_url_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Material
        fields = ['id', 'titulo', 'tipo', 'archivo', 'archivo_url', 'archivo_url_display',
                  'curso', 'curso_nombre', 'leccion_id', 'fecha_subida', 'fecha_formateada']
    
    def get_fecha_formateada(self, obj):
        return obj.fecha_subida.strftime('%d/%m/%Y %H:%M')
    
    def get_archivo_url_display(self, obj):
        if obj.archivo:
            return obj.archivo.url
        return obj.archivo_url

class MaterialCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['titulo', 'tipo', 'archivo', 'archivo_url', 'curso', 'leccion_id']