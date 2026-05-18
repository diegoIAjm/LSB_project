# apps/senas/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Senas, CategoriasSenas
from .serializers import SenaSerializer, CategoriaSenaSerializer
import os
import json

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = CategoriasSenas.objects.all().order_by('nombre')
    serializer_class = CategoriaSenaSerializer


class SenaViewSet(viewsets.ModelViewSet):
    queryset = Senas.objects.all().order_by('nombre')
    serializer_class = SenaSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        categoria_id = self.request.query_params.get('categoria_id')
        if categoria_id:
            queryset = queryset.filter(categoria_id=categoria_id)
        return queryset
    
    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Obtener señas agrupadas por categoría"""
        categorias = CategoriasSenas.objects.all()
        resultado = []
        
        for cat in categorias:
            senas = Senas.objects.filter(categoria_id=cat.id)
            resultado.append({
                'categoria_id': cat.id,
                'categoria_nombre': cat.nombre,
                'senas': SenaSerializer(senas, many=True).data
            })
        
        return Response(resultado)

    @action(detail=True, methods=['get'], url_path='keypoints')
    def get_keypoints(self, request, pk=None):
        """Devuelve los keypoints de una seña para animar el avatar"""
        sena = self.get_object()
        
        # Buscar archivo de keypoints en ia-training
        keypoints_path = f'C:/LSB_2.0.0/ia-training/data/keypoints/{sena.nombre.lower()}.json'
        
        if os.path.exists(keypoints_path):
            with open(keypoints_path, 'r') as f:
                keypoints = json.load(f)
            return Response(keypoints)
        
        return Response({'error': f'Keypoints no encontrados para {sena.nombre}'}, status=404)