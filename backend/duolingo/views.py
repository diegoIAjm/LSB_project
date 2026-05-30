from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Max, Count, Q
from .models import Nivel, Unidad, Leccion, Ejercicio, ProgresoUsuario, PuntosUsuario, IntentosEjercicio, ActividadUsuario, Logro, UsuarioLogro
from .serializers import (
    NivelSerializer, UnidadSerializer, LeccionSerializer, 
    EjercicioSerializer, ProgresoUsuarioSerializer, 
    PuntosUsuarioSerializer, IntentosEjercicioSerializer,
    EvaluarEjercicioSerializer, LogroSerializer, UsuarioLogroSerializer, LogroConEstadoSerializer, RespuestaEvaluacionSerializer, RespuestaCompletarLeccionSerializer
)
from usuarios.models import Estudiante

from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from collections import defaultdict

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



class SiguienteContenidoView(APIView):
    """Obtener siguiente lección/unidad/nivel desbloqueado"""
    
    def get(self, request):
        estudiante_id = request.query_params.get('estudiante_id')
        if not estudiante_id:
            return Response({'error': 'Se requiere estudiante_id'}, status=400)
        
        # Obtener lecciones completadas
        completadas = ProgresoUsuario.objects.filter(
            estudiante_id=estudiante_id,
            completado=True
        ).values_list('leccion_id', flat=True)
        
        # Buscar siguiente lección no completada
        siguiente_leccion = Leccion.objects.exclude(
            id__in=completadas
        ).order_by('unidad__nivel__id', 'unidad__orden', 'orden').first()
        
        resultado = {
            'siguiente_leccion': None,
            'siguiente_unidad': None,
            'siguiente_nivel': None
        }
        
        if siguiente_leccion:
            resultado['siguiente_leccion'] = {
                'id': siguiente_leccion.id,
                'titulo': siguiente_leccion.titulo,
                'unidad_id': siguiente_leccion.unidad_id,
                'unidad_nombre': siguiente_leccion.unidad.nombre
            }
        else:
            # Si no hay más lecciones, buscar siguiente unidad
            unidades_completadas = ProgresoUsuario.objects.filter(
                estudiante_id=estudiante_id,
                completado=True
            ).values_list('leccion__unidad_id', flat=True).distinct()
            
            siguiente_unidad = Unidad.objects.exclude(
                id__in=unidades_completadas
            ).order_by('nivel__id', 'orden').first()
            
            if siguiente_unidad:
                resultado['siguiente_unidad'] = {
                    'id': siguiente_unidad.id,
                    'nombre': siguiente_unidad.nombre,
                    'nivel_id': siguiente_unidad.nivel_id
                }
            else:
                # Si no hay más unidades, buscar siguiente nivel
                niveles_completados = ProgresoUsuario.objects.filter(
                    estudiante_id=estudiante_id,
                    completado=True
                ).values_list('leccion__unidad__nivel_id', flat=True).distinct()
                
                siguiente_nivel = Nivel.objects.exclude(
                    id__in=niveles_completados
                ).order_by('id').first()
                
                if siguiente_nivel:
                    resultado['siguiente_nivel'] = {
                        'id': siguiente_nivel.id,
                        'nombre': siguiente_nivel.nombre
                    }
        
        return Response(resultado)

# ========== COMPLETAR LECCIÓN CON LOGROS ==========
class CompletarLeccionConLogrosView(APIView):
    """Completar una lección y verificar logros"""
    
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
        
        # Guardar progreso
        progreso, created = ProgresoUsuario.objects.get_or_create(
            estudiante=estudiante,
            leccion=leccion
        )
        
        progreso.completado = True
        progreso.puntuacion = puntuacion
        progreso.precision = precision
        progreso.intentos += 1
        progreso.save()
        
        # Actualizar puntos totales
        puntos_obj, _ = PuntosUsuario.objects.get_or_create(estudiante=estudiante)
        puntos_obj.puntos_totales += puntuacion
        puntos_obj.ultima_actividad = timezone.now()
        
        # Actualizar racha
        if puntos_obj.ultima_actividad:
            ultima = puntos_obj.ultima_actividad
            hoy = timezone.now().date()
            if ultima.date() == hoy - timedelta(days=1):
                puntos_obj.racha_dias += 1
            elif ultima.date() != hoy:
                puntos_obj.racha_dias = 1
        else:
            puntos_obj.racha_dias = 1
        puntos_obj.save()
        
        # Verificar logros
        logros_desbloqueados = self.verificar_logros(estudiante, puntos_obj.racha_dias)
        
        # Obtener siguiente lección
        siguiente_leccion = Leccion.objects.filter(
            unidad_id=leccion.unidad_id,
            orden__gt=leccion.orden
        ).first()
        
        siguiente_unidad = None
        if not siguiente_leccion:
            siguiente_unidad = Unidad.objects.filter(
                nivel_id=leccion.unidad.nivel_id,
                orden__gt=leccion.unidad.orden
            ).first()
        
        # Registrar actividad
        ActividadUsuario.objects.create(
            estudiante=estudiante,
            modulo='duolingo',
            accion=f'leccion_completada_{leccion_id}'
        )
        
        return Response({
            'success': True,
            'puntos_totales': puntos_obj.puntos_totales,
            'racha_dias': puntos_obj.racha_dias,
            'logros_desbloqueados': logros_desbloqueados,
            'siguiente_leccion': {
                'id': siguiente_leccion.id,
                'titulo': siguiente_leccion.titulo
            } if siguiente_leccion else None,
            'siguiente_unidad': {
                'id': siguiente_unidad.id,
                'nombre': siguiente_unidad.nombre
            } if siguiente_unidad else None
        })
    
    def verificar_logros(self, estudiante, racha_actual):
        """Verificar y otorgar logros automáticamente"""
        logros_desbloqueados = []
        
        # Contar lecciones completadas
        lecciones_completadas = ProgresoUsuario.objects.filter(
            estudiante=estudiante,
            completado=True
        ).count()
        
        # Obtener mejor precisión
        mejor_precision = ProgresoUsuario.objects.filter(
            estudiante=estudiante,
            completado=True
        ).aggregate(Max('precision'))['precision__max'] or 0
        
        # Verificar unidades completadas
        unidades_completadas = self.contar_unidades_completadas(estudiante)
        
        # Verificar cada tipo de logro
        logros = Logro.objects.all()
        
        for logro in logros:
            # Verificar si ya está desbloqueado
            if UsuarioLogro.objects.filter(estudiante=estudiante, logro=logro).exists():
                continue
            
            desbloqueado = False
            
            if logro.tipo == 'completar_leccion':
                if lecciones_completadas >= logro.condicion_valor:
                    desbloqueado = True
            elif logro.tipo == 'completar_unidad':
                if unidades_completadas >= logro.condicion_valor:
                    desbloqueado = True
            elif logro.tipo == 'racha':
                if racha_actual >= logro.condicion_valor:
                    desbloqueado = True
            elif logro.tipo == 'puntuacion':
                if mejor_precision >= logro.condicion_valor:
                    desbloqueado = True
            
            if desbloqueado:
                UsuarioLogro.objects.create(
                    estudiante=estudiante,
                    logro=logro
                )
                # Otorgar puntos extra
                puntos_obj, _ = PuntosUsuario.objects.get_or_create(estudiante=estudiante)
                puntos_obj.puntos_totales += logro.puntos_recompensa
                puntos_obj.save()
                
                logros_desbloqueados.append({
                    'id': logro.id,
                    'nombre': logro.nombre,
                    'descripcion': logro.descripcion,
                    'imagen': logro.imagen,
                    'puntos_recompensa': logro.puntos_recompensa
                })
        
        return logros_desbloqueados
    
    def contar_unidades_completadas(self, estudiante):
        """Contar cuántas unidades tienen todas las lecciones completadas"""
        unidades = Unidad.objects.all()
        completadas = 0
        
        for unidad in unidades:
            lecciones_unidad = Leccion.objects.filter(unidad=unidad)
            lecciones_ids = [l.id for l in lecciones_unidad]
            
            completadas_unidad = ProgresoUsuario.objects.filter(
                estudiante=estudiante,
                leccion_id__in=lecciones_ids,
                completado=True
            ).count()
            
            if completadas_unidad == lecciones_unidad.count() and lecciones_unidad.count() > 0:
                completadas += 1
        
        return completadas

# ========== OBTENER LOGROS DEL USUARIO ==========
class LogrosUsuarioView(APIView):
    """Obtener todos los logros del usuario con estado"""
    
    def get(self, request, estudiante_id):
        try:
            estudiante = Estudiante.objects.get(id=estudiante_id)
        except Estudiante.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado'}, status=404)
        
        logros_obtenidos = set(
            UsuarioLogro.objects.filter(estudiante=estudiante).values_list('logro_id', flat=True)
        )
        
        todos_logros = Logro.objects.all()
        
        resultado = []
        for logro in todos_logros:
            resultado.append({
                'id': logro.id,
                'nombre': logro.nombre,
                'descripcion': logro.descripcion,
                'imagen': logro.imagen,
                'desbloqueado': logro.id in logros_obtenidos,
                'puntos_recompensa': logro.puntos_recompensa
            })
        
        return Response(resultado)

# ========== VERIFICAR SI LECCIÓN ESTÁ DESBLOQUEADA ==========
class VerificarDesbloqueoLeccionView(APIView):
    """Verificar si una lección está desbloqueada para el estudiante"""
    
    def get(self, request, leccion_id):
        estudiante_id = request.query_params.get('estudiante_id')
        if not estudiante_id:
            return Response({'error': 'Se requiere estudiante_id'}, status=400)
        
        try:
            leccion = Leccion.objects.get(id=leccion_id)
        except Leccion.DoesNotExist:
            return Response({'error': 'Lección no encontrada'}, status=404)
        
        # Si es la primera lección de la unidad, está desbloqueada
        if leccion.orden == 1:
            # Verificar si la unidad anterior está completada
            unidad_anterior = Unidad.objects.filter(
                nivel_id=leccion.unidad.nivel_id,
                orden=leccion.unidad.orden - 1
            ).first()
            
            if unidad_anterior:
                # Verificar si todas las lecciones de la unidad anterior están completadas
                lecciones_anterior = Leccion.objects.filter(unidad=unidad_anterior)
                completadas = ProgresoUsuario.objects.filter(
                    estudiante_id=estudiante_id,
                    leccion_id__in=[l.id for l in lecciones_anterior],
                    completado=True
                ).count()
                
                if completadas == lecciones_anterior.count():
                    return Response({'desbloqueada': True})
                else:
                    return Response({'desbloqueada': False})
            else:
                return Response({'desbloqueada': True})
        
        # Para otras lecciones, verificar que la lección anterior esté completada
        leccion_anterior = Leccion.objects.filter(
            unidad_id=leccion.unidad_id,
            orden=leccion.orden - 1
        ).first()
        
        if leccion_anterior:
            completada = ProgresoUsuario.objects.filter(
                estudiante_id=estudiante_id,
                leccion=leccion_anterior,
                completado=True
            ).exists()
            return Response({'desbloqueada': completada})
        
        return Response({'desbloqueada': True})