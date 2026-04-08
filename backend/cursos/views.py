from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Curso
from .serializers import CursoSerializer, CursoCreateUpdateSerializer, DocenteSimpleSerializer
from usuarios.models import Docente

class CursoListView(generics.ListAPIView):
    """Listar todos los cursos con filtros"""
    serializer_class = CursoSerializer
    
    def get_queryset(self):
        queryset = Curso.objects.all()
        
        # Filtros
        nivel = self.request.query_params.get('nivel')
        estado = self.request.query_params.get('estado')
        docente_id = self.request.query_params.get('docente')
        
        if nivel:
            queryset = queryset.filter(nivel=nivel)
        if estado:
            queryset = queryset.filter(estado=estado)
        if docente_id:
            queryset = queryset.filter(docente_id=docente_id)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'cursos': serializer.data,
            'total': queryset.count()
        })

class CursoCreateView(generics.CreateAPIView):
    """Crear un nuevo curso"""
    serializer_class = CursoCreateUpdateSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        curso = serializer.save()
        
        # Devolver datos completos
        data = CursoSerializer(curso).data
        return Response({
            'mensaje': 'Curso creado correctamente',
            'curso': data
        }, status=status.HTTP_201_CREATED)

class CursoDetailView(generics.RetrieveAPIView):
    """Obtener detalle de un curso"""
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer
    lookup_field = 'pk'

class CursoUpdateView(generics.UpdateAPIView):
    """Actualizar un curso"""
    queryset = Curso.objects.all()
    serializer_class = CursoCreateUpdateSerializer
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        curso = serializer.save()
        
        data = CursoSerializer(curso).data
        return Response({
            'mensaje': 'Curso actualizado correctamente',
            'curso': data
        }, status=status.HTTP_200_OK)

class CursoDeleteView(generics.DestroyAPIView):
    """Eliminar (desactivar) un curso"""
    queryset = Curso.objects.all()
    lookup_field = 'pk'
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # En lugar de eliminar, cambiar estado a 'inactivo'
        instance.estado = 'inactivo'
        instance.save()
        return Response({
            'mensaje': 'Curso desactivado correctamente'
        }, status=status.HTTP_200_OK)

class CursoToggleEstadoView(APIView):
    """Activar/Desactivar un curso"""
    
    def patch(self, request, pk):
        try:
            curso = Curso.objects.get(pk=pk)
            nuevo_estado = request.data.get('estado')
            
            if nuevo_estado and nuevo_estado in ['activo', 'inactivo', 'finalizado']:
                curso.estado = nuevo_estado
            else:
                # Toggle entre activo e inactivo
                curso.estado = 'inactivo' if curso.estado == 'activo' else 'activo'
            
            curso.save()
            return Response({
                'mensaje': f'Curso {curso.estado} correctamente',
                'estado': curso.estado
            }, status=status.HTTP_200_OK)
            
        except Curso.DoesNotExist:
            return Response({
                'error': 'Curso no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

class DocentesDisponiblesView(generics.ListAPIView):
    """Listar docentes disponibles para asignar a cursos"""
    
    def get(self, request):
        from usuarios.models import Docente
        from .serializers import DocenteSimpleSerializer
        
        docentes = Docente.objects.filter(usuario__estado='activo')
        print("Docentes encontrados:", docentes)  # Debug
        
        for docente in docentes:
            print(f"Docente ID: {docente.id}, Usuario: {docente.usuario.nombre} {docente.usuario.apellido}")
        
        serializer = DocenteSimpleSerializer(docentes, many=True)
        print("Serialized data:", serializer.data)  # Debug
        
        return Response(serializer.data)