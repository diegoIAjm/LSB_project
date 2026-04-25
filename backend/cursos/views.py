# cursos/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q  # 👈 Para búsquedas avanzadas
from .models import Curso, Inscripcion, Horario
from .serializers import (
    CursoSerializer, CursoCreateUpdateSerializer, CursoDisponibleSerializer, 
    DocenteSimpleSerializer, EstudianteSimpleSerializer, InscripcionCreateSerializer, 
    InscripcionSerializer, HorarioSerializer, HorarioCreateUpdateSerializer
)
from usuarios.models import Docente, Estudiante
from duolingo.models import Nivel  # 👈 IMPORTAR Nivel

class CursoListView(generics.ListAPIView):
    """Listar todos los cursos con filtros"""
    serializer_class = CursoSerializer
    
    def get_queryset(self):
        queryset = Curso.objects.all()
        
        # 🔹 FILTROS ACTUALIZADOS
        nivel_id = self.request.query_params.get('nivel')  # Ahora es ID del nivel
        estado = self.request.query_params.get('estado')
        docente_id = self.request.query_params.get('docente')
        search = self.request.query_params.get('search')  # Búsqueda por nombre
        
        # Filtrar por nivel (ahora por ID)
        if nivel_id:
            try:
                nivel_id = int(nivel_id)
                queryset = queryset.filter(nivel_id=nivel_id)
            except ValueError:
                pass  # Si no es número, ignorar
        
        if estado:
            queryset = queryset.filter(estado=estado)
        
        if docente_id:
            try:
                docente_id = int(docente_id)
                queryset = queryset.filter(docente_id=docente_id)
            except ValueError:
                pass
        
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(nivel__nombre__icontains=search)  # 🔹 Buscar por nombre del nivel
            )
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'cursos': serializer.data,
            'total': queryset.count(),
            'filtros': {
                'nivel': request.query_params.get('nivel'),
                'estado': request.query_params.get('estado'),
                'docente': request.query_params.get('docente')
            }
        })


class CursoCreateView(generics.CreateAPIView):
    """Crear un nuevo curso"""
    serializer_class = CursoCreateUpdateSerializer
    
    def create(self, request, *args, **kwargs):
        # 🔹 Verificar que el nivel existe antes de crear
        nivel_id = request.data.get('nivel')
        if nivel_id:
            try:
                nivel = Nivel.objects.get(id=nivel_id)
            except Nivel.DoesNotExist:
                return Response({
                    'error': f'El nivel con id {nivel_id} no existe'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        curso = serializer.save()
        
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
        # 🔹 Verificar que el nivel existe si se está actualizando
        nivel_id = request.data.get('nivel')
        if nivel_id:
            try:
                nivel = Nivel.objects.get(id=nivel_id)
            except Nivel.DoesNotExist:
                return Response({
                    'error': f'El nivel con id {nivel_id} no existe'
                }, status=status.HTTP_400_BAD_REQUEST)
        
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


# 👈 NUEVA VISTA: Obtener niveles disponibles para filtrar
class NivelesDisponiblesView(generics.ListAPIView):
    """Listar niveles disponibles para filtros"""
    
    def get(self, request):
        niveles = Nivel.objects.all().values('id', 'nombre')
        return Response(list(niveles))


class DocentesDisponiblesView(generics.ListAPIView):
    """Listar docentes disponibles para asignar a cursos"""
    
    def get(self, request):
        docentes = Docente.objects.filter(usuario__estado='activo')
        serializer = DocenteSimpleSerializer(docentes, many=True)
        return Response(serializer.data)


class EstudiantesDisponiblesView(generics.ListAPIView):
    """Listar estudiantes activos que NO están inscritos en un curso específico"""
    
    def get(self, request):
        curso_id = request.query_params.get('curso_id')
        
        estudiantes = Estudiante.objects.filter(usuario__estado='activo')
        
        if curso_id:
            try:
                curso = Curso.objects.get(id=curso_id)
                estudiantes_inscritos = Inscripcion.objects.filter(curso=curso).values_list('estudiante_id', flat=True)
                estudiantes = estudiantes.exclude(id__in=estudiantes_inscritos)
            except Curso.DoesNotExist:
                pass
        
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inscripcion = serializer.save()
        
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


class CursosActivosView(generics.ListAPIView):
    """Listar cursos activos para inscripción (alias)"""
    
    def get(self, request):
        cursos = Curso.objects.filter(estado='activo')
        serializer = CursoDisponibleSerializer(cursos, many=True)
        return Response(serializer.data)


class InscripcionMasivaView(APIView):
    """Inscribir múltiples estudiantes a un curso"""
    
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


class CursoEstudiantesView(APIView):
    """Obtener estudiantes inscritos en un curso"""
    
    def get(self, request, pk):
        try:
            curso = Curso.objects.get(pk=pk)
            inscripciones = Inscripcion.objects.filter(curso=curso).select_related('estudiante__usuario')
            
            estudiantes = []
            for ins in inscripciones:
                estudiantes.append({
                    'id': ins.id,
                    'estudiante_id': ins.estudiante.id,
                    'nombre': f"{ins.estudiante.usuario.nombre} {ins.estudiante.usuario.apellido}",
                    'email': ins.estudiante.usuario.email,
                    'ci': ins.estudiante.usuario.ci,
                    'fecha_inscripcion': ins.fecha_inscripcion,
                    'estado': ins.estado,
                    'nivel': ins.estudiante.nivel_actual,
                    'progreso': 0
                })
            
            return Response({
                'curso_nombre': curso.nombre,
                'curso_nivel': curso.nivel.nombre,  # 🔹 Añadido nivel del curso
                'estudiantes': estudiantes,
                'total': len(estudiantes)
            })
        except Curso.DoesNotExist:
            return Response({'error': 'Curso no encontrado'}, status=404)


class HorarioListView(generics.ListAPIView):
    """Listar horarios de un curso"""
    serializer_class = HorarioSerializer
    
    def get_queryset(self):
        curso_id = self.request.query_params.get('curso_id')
        if curso_id:
            return Horario.objects.filter(curso_id=curso_id)
        return Horario.objects.all()


class HorarioCreateView(generics.CreateAPIView):
    """Crear un nuevo horario"""
    serializer_class = HorarioCreateUpdateSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        horario = serializer.save()
        
        data = HorarioSerializer(horario).data
        return Response({
            'mensaje': 'Horario creado correctamente',
            'horario': data
        }, status=status.HTTP_201_CREATED)


class HorarioDetailView(generics.RetrieveAPIView):
    """Obtener detalle de un horario"""
    queryset = Horario.objects.all()
    serializer_class = HorarioSerializer
    lookup_field = 'pk'


class HorarioUpdateView(generics.UpdateAPIView):
    """Actualizar un horario"""
    queryset = Horario.objects.all()
    serializer_class = HorarioCreateUpdateSerializer
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        horario = serializer.save()
        
        data = HorarioSerializer(horario).data
        return Response({
            'mensaje': 'Horario actualizado correctamente',
            'horario': data
        }, status=status.HTTP_200_OK)


class HorarioDeleteView(generics.DestroyAPIView):
    """Eliminar un horario"""
    queryset = Horario.objects.all()
    lookup_field = 'pk'
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({
            'mensaje': 'Horario eliminado correctamente'
        }, status=status.HTTP_200_OK)