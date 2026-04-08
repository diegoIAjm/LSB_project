from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Curso, Inscripcion
from .serializers import CursoSerializer, CursoCreateUpdateSerializer, CursoDisponibleSerializer, DocenteSimpleSerializer,EstudianteSimpleSerializer, InscripcionCreateSerializer, InscripcionSerializer
from usuarios.models import Docente, Estudiante

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
    
class EstudiantesDisponiblesView(generics.ListAPIView):
    """Listar estudiantes activos"""
    
    def get(self, request):
        estudiantes = Estudiante.objects.filter(usuario__estado='activo')
        serializer = EstudianteSimpleSerializer(estudiantes, many=True)
        return Response(serializer.data)

class CursosDisponiblesView(generics.ListAPIView):
    """Listar cursos activos para inscripción"""
    
    def get(self, request):
        cursos = Curso.objects.filter(estado='activo')
        serializer = CursoDisponibleSerializer(cursos, many=True)
        return Response(serializer.data)

class InscripcionListView(generics.ListAPIView):
    """Listar todas las inscripciones con filtros"""
    
    def get(self, request):
        inscripciones = Inscripcion.objects.all().order_by('-fecha_inscripcion')
        
        # Filtro por estado
        estado = request.query_params.get('estado')
        if estado:
            inscripciones = inscripciones.filter(estado=estado)
        
        serializer = InscripcionSerializer(inscripciones, many=True)
        return Response({
            'inscripciones': serializer.data,
            'total': inscripciones.count()
        })

class InscripcionCreateView(generics.CreateAPIView):
    """Crear nueva inscripción"""
    serializer_class = InscripcionCreateSerializer
    
    def create(self, request, *args, **kwargs):
        print("📥 Datos recibidos en inscripción:", request.data)  # Debug
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inscripcion = serializer.save()
        
        print("✅ Inscripción creada:", inscripcion.id)  # Debug
        
        data = InscripcionSerializer(inscripcion).data
        return Response({
            'mensaje': 'Estudiante inscrito correctamente',
            'inscripcion': data
        }, status=status.HTTP_201_CREATED)

class InscripcionCancelarView(APIView):
    """Cancelar inscripción"""
    
    def patch(self, request, pk):
        try:
            inscripcion = Inscripcion.objects.get(pk=pk)
            inscripcion.estado = 'cancelado'
            inscripcion.save()
            return Response({'mensaje': 'Inscripción cancelada correctamente'})
        except Inscripcion.DoesNotExist:
            return Response({'error': 'Inscripción no encontrada'}, status=404)
        


        # Añadir esta nueva vista
class CursosActivosView(generics.ListAPIView):
    """Listar cursos activos para inscripción (alias)"""
    
    def get(self, request):
        cursos = Curso.objects.filter(estado='activo')
        serializer = CursoDisponibleSerializer(cursos, many=True)
        return Response(serializer.data)


class InscripcionMasivaView(APIView):
    def post(self, request):
        curso_id = request.data.get('curso')
        estudiantes_ids = request.data.get('estudiantes', [])
        
        if not curso_id:
            return Response({'error': 'Debe seleccionar un curso'}, status=400)
        
        if not estudiantes_ids:
            return Response({'error': 'Debe seleccionar al menos un estudiante'}, status=400)
        
        try:
            curso = Curso.objects.get(id=curso_id, estado='activo')
        except Curso.DoesNotExist:
            return Response({'error': 'Curso no encontrado o no activo'}, status=404)
        
        inscritos = 0
        errores = []
        
        for est_id in estudiantes_ids:
            try:
                estudiante = Estudiante.objects.get(id=est_id, usuario__estado='activo')
                
                # Verificar si ya existe inscripción (activa o cancelada)
                if Inscripcion.objects.filter(estudiante=estudiante, curso=curso).exists():
                    errores.append(f'{estudiante.usuario.nombre} {estudiante.usuario.apellido} ya tiene una inscripción en este curso')
                    continue
                
                Inscripcion.objects.create(
                    estudiante=estudiante,
                    curso=curso,
                    estado='activo'
                )
                inscritos += 1
                
            except Estudiante.DoesNotExist:
                errores.append(f'Estudiante ID {est_id} no encontrado')
        
        if inscritos > 0:
            mensaje = f'{inscritos} estudiantes inscritos correctamente'
            if errores:
                mensaje += f'. No se pudieron inscribir: {", ".join(errores[:5])}'
            return Response({
                'mensaje': mensaje,
                'inscritos': inscritos,
                'errores': errores
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'mensaje': f'No se pudo inscribir ningún estudiante. Errores: {", ".join(errores[:5])}',
                'inscritos': 0,
                'errores': errores
            }, status=status.HTTP_400_BAD_REQUEST)