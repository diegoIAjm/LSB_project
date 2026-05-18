from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from .models import Nivel, Unidad, Leccion, Ejercicio, ProgresoUsuario, PuntosUsuario, IntentosEjercicio, ActividadUsuario
from .serializers import (
    NivelSerializer, UnidadSerializer, LeccionSerializer, 
    EjercicioSerializer, ProgresoUsuarioSerializer, 
    PuntosUsuarioSerializer, IntentosEjercicioSerializer,
    EvaluarEjercicioSerializer
)
from usuarios.models import Estudiante

# ========== NIVELES ==========
class NivelListView(generics.ListAPIView):
    """Listar todos los niveles"""
    queryset = Nivel.objects.all()
    serializer_class = NivelSerializer

# ========== UNIDADES ==========
class UnidadListView(generics.ListAPIView):
    """Listar unidades por nivel"""
    serializer_class = UnidadSerializer
    
    def get_queryset(self):
        nivel_id = self.request.query_params.get('nivel_id')
        if nivel_id:
            return Unidad.objects.filter(nivel_id=nivel_id)
        return Unidad.objects.all()

# ========== LECCIONES ==========
class LeccionListView(generics.ListAPIView):
    """Listar lecciones por unidad"""
    serializer_class = LeccionSerializer
    
    def get_queryset(self):
        unidad_id = self.request.query_params.get('unidad_id')
        if unidad_id:
            return Leccion.objects.filter(unidad_id=unidad_id)
        return Leccion.objects.all()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# ========== EJERCICIOS ==========
class EjercicioListView(generics.ListAPIView):
    """Listar ejercicios por lección"""
    serializer_class = EjercicioSerializer
    
    def get_queryset(self):
        leccion_id = self.request.query_params.get('leccion_id')
        if leccion_id:
            return Ejercicio.objects.filter(leccion_id=leccion_id).order_by('nivel', 'id')
        return Ejercicio.objects.none()

# ========== PROGRESO ==========
class ProgresoUsuarioView(generics.ListAPIView):
    """Obtener progreso del estudiante"""
    serializer_class = ProgresoUsuarioSerializer
    
    def get_queryset(self):
        estudiante_id = self.request.query_params.get('estudiante_id')
        if estudiante_id:
            return ProgresoUsuario.objects.filter(estudiante_id=estudiante_id)
        return ProgresoUsuario.objects.none()

# ========== PUNTOS ==========
class PuntosUsuarioView(APIView):
    """Obtener puntos del estudiante"""
    
    def get(self, request):
        estudiante_id = request.query_params.get('estudiante_id')
        if not estudiante_id:
            return Response({'error': 'Se requiere estudiante_id'}, status=400)
        
        try:
            puntos = PuntosUsuario.objects.get(estudiante_id=estudiante_id)
            serializer = PuntosUsuarioSerializer(puntos)
            return Response(serializer.data)
        except PuntosUsuario.DoesNotExist:
            # Crear registro de puntos si no existe
            try:
                estudiante = Estudiante.objects.get(id=estudiante_id)
                puntos = PuntosUsuario.objects.create(estudiante=estudiante)
                serializer = PuntosUsuarioSerializer(puntos)
                return Response(serializer.data)
            except Estudiante.DoesNotExist:
                return Response({'error': 'Estudiante no encontrado'}, status=404)

# ========== INTENTOS ==========
class IntentosEjercicioView(generics.ListAPIView):
    """Obtener intentos del estudiante por ejercicio"""
    serializer_class = IntentosEjercicioSerializer
    
    def get_queryset(self):
        estudiante_id = self.request.query_params.get('estudiante_id')
        ejercicio_id = self.request.query_params.get('ejercicio_id')
        
        queryset = IntentosEjercicio.objects.all()
        if estudiante_id:
            queryset = queryset.filter(estudiante_id=estudiante_id)
        if ejercicio_id:
            queryset = queryset.filter(ejercicio_id=ejercicio_id)
        
        return queryset

# ========== EVALUAR EJERCICIO (SIN IA) ==========
class EvaluarEjercicioView(APIView):
    """Evaluar ejercicio (versión sin IA para pruebas)"""
    
    def post(self, request):
        serializer = EvaluarEjercicioSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        data = serializer.validated_data
        estudiante_id = data['estudiante_id']
        ejercicio_id = data['ejercicio_id']
        keypoints = data.get('keypoints', {})
        
        try:
            estudiante = Estudiante.objects.get(id=estudiante_id)
            ejercicio = Ejercicio.objects.get(id=ejercicio_id)
        except (Estudiante.DoesNotExist, Ejercicio.DoesNotExist):
            return Response({'error': 'Estudiante o ejercicio no encontrado'}, status=404)
        
        # 🔹 LÓGICA TEMPORAL SIN IA
        # Simular evaluación (esto se reemplazará con IA después)
        import random
        precision = random.randint(50, 100)
        
        if precision >= 85:
            color = "verde"
            puntos = int(precision)
        elif precision >= 60:
            color = "amarillo"
            puntos = int(precision * 0.8)
        else:
            color = "rojo"
            puntos = int(precision * 0.5)
        
        feedback = {
            "mano": "verde" if precision > 80 else "amarillo" if precision > 60 else "rojo",
            "movimiento": "verde" if precision > 85 else "amarillo" if precision > 65 else "rojo",
            "posicion": "verde" if precision > 75 else "amarillo" if precision > 55 else "rojo"
        }
        
        # Guardar intento
        intento = IntentosEjercicio.objects.create(
            estudiante=estudiante,
            ejercicio=ejercicio,
            puntuacion=puntos,
            precision=precision,
            resultado_color=color,
            feedback=feedback,
            keypoints=keypoints
        )
        
        # Actualizar puntos del usuario
        puntos_obj, created = PuntosUsuario.objects.get_or_create(estudiante=estudiante)
        puntos_obj.puntos_totales += puntos
        puntos_obj.ultima_actividad = intento.fecha
        puntos_obj.save()
        
        # Registrar actividad
        ActividadUsuario.objects.create(
            estudiante=estudiante,
            modulo='duolingo',
            accion=f'ejercicio_{ejercicio_id}_resultado_{color}'
        )
        
        return Response({
            'id': intento.id,
            'precision': float(precision),
            'color': color,
            'puntos_ganados': puntos,
            'puntos_totales': puntos_obj.puntos_totales,
            'feedback': feedback
        }, status=status.HTTP_201_CREATED)

# ========== COMPLETAR LECCIÓN ==========
class CompletarLeccionView(APIView):
    """Completar una lección"""
    
    def post(self, request):
        estudiante_id = request.data.get('estudiante_id')
        leccion_id = request.data.get('leccion_id')
        puntuacion = request.data.get('puntuacion', 0)
        precision = request.data.get('precision', 0)
        
        if not estudiante_id or not leccion_id:
            return Response({'error': 'Se requiere estudiante_id y leccion_id'}, status=400)
        
        try:
            estudiante = Estudiante.objects.get(id=estudiante_id)
            leccion = Leccion.objects.get(id=leccion_id)
        except (Estudiante.DoesNotExist, Leccion.DoesNotExist):
            return Response({'error': 'Estudiante o lección no encontrada'}, status=404)
        
        progreso, created = ProgresoUsuario.objects.get_or_create(
            estudiante=estudiante,
            leccion=leccion
        )
        
        progreso.completado = True
        progreso.puntuacion = puntuacion
        progreso.precision = precision
        progreso.intentos += 1
        progreso.save()
        
        # Registrar actividad
        ActividadUsuario.objects.create(
            estudiante=estudiante,
            modulo='duolingo',
            accion=f'leccion_completada_{leccion_id}'
        )
        
        return Response({
            'mensaje': f'Lección {leccion.titulo} completada',
            'progreso': ProgresoUsuarioSerializer(progreso).data
        })

