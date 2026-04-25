from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Material
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import MaterialSerializer, MaterialCreateUpdateSerializer
from cursos.models import Curso
from rest_framework.parsers import JSONParser

class MaterialListView(generics.ListAPIView):
    """Listar materiales (todos o por curso)"""
    serializer_class = MaterialSerializer
    
    def get_queryset(self):
        curso_id = self.request.query_params.get('curso_id')
        if curso_id:
            return Material.objects.filter(curso_id=curso_id)
        return Material.objects.all()
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'materiales': serializer.data,
            'total': queryset.count()
        })

class MaterialCreateView(generics.CreateAPIView):
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = MaterialCreateUpdateSerializer
    
    def create(self, request, *args, **kwargs):
        print("📥 Datos recibidos:", request.data)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        material = serializer.save()
        
        data = MaterialSerializer(material).data
        return Response({
            'mensaje': 'Material subido correctamente',
            'material': data
        }, status=status.HTTP_201_CREATED)

class MaterialDetailView(generics.RetrieveAPIView):
    """Obtener detalle de un material"""
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    lookup_field = 'pk'

class MaterialUpdateView(generics.UpdateAPIView):
    """Actualizar un material"""
    queryset = Material.objects.all()
    serializer_class = MaterialCreateUpdateSerializer
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        material = serializer.save()
        
        data = MaterialSerializer(material).data
        return Response({
            'mensaje': 'Material actualizado correctamente',
            'material': data
        }, status=status.HTTP_200_OK)

class MaterialDeleteView(generics.DestroyAPIView):
    """Eliminar un material"""
    queryset = Material.objects.all()
    lookup_field = 'pk'
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({
            'mensaje': 'Material eliminado correctamente'
        }, status=status.HTTP_200_OK)