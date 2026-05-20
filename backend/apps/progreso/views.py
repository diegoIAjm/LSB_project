# apps/progreso/views.py
from django.db.models import Max, Avg
from duolingo.models import ProgresoUsuario, PuntosUsuario, IntentosEjercicio, Leccion, Unidad, Nivel
from usuarios.models import Estudiante
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

@api_view(['GET'])
def estadisticas_estudiante(request):
    estudiante_id = request.query_params.get('estudiante_id')
    
    if not estudiante_id:
        return Response({'error': 'Se requiere estudiante_id'}, status=400)
    
    try:
        estudiante_id = int(estudiante_id)
    except ValueError:
        return Response({'error': 'estudiante_id debe ser número'}, status=400)
    
    # ========== OBTENER EL NIVEL DEL ESTUDIANTE ==========
    nivel_actual = "Básico"  # valor por defecto
    try:
        estudiante = Estudiante.objects.get(id=estudiante_id)
        if estudiante.nivel_actual:
            nivel_actual = estudiante.nivel_actual
        print(f"Estudiante {estudiante_id} - Nivel: {nivel_actual}")
    except Estudiante.DoesNotExist:
        print(f"Estudiante {estudiante_id} no encontrado")
    
    # Obtener puntos totales
    puntos, _ = PuntosUsuario.objects.get_or_create(estudiante_id=estudiante_id)
    
    # Obtener estadísticas de intentos
    intentos = IntentosEjercicio.objects.filter(estudiante_id=estudiante_id)
    
    total_ejercicios = intentos.count()
    ejercicios_aprobados = intentos.filter(resultado_color='verde').count()
    promedio_precision = intentos.aggregate(avg=Avg('precision'))['avg'] or 0
    
    # Obtener progreso de lecciones
    progreso_lecciones = ProgresoUsuario.objects.filter(estudiante_id=estudiante_id)
    lecciones_completadas = progreso_lecciones.filter(completado=True).count()
    total_lecciones = Leccion.objects.count()
    
    # Calcular racha
    actividades = intentos.dates('fecha', 'day', order='DESC')
    racha = 0
    fecha_esperada = timezone.now().date()
    
    for fecha in actividades:
        if fecha == fecha_esperada:
            racha += 1
            fecha_esperada -= timedelta(days=1)
        else:
            break
    
    # Calcular porcentaje de completado
    porcentaje = round((lecciones_completadas / total_lecciones * 100), 1) if total_lecciones > 0 else 0
    
    return Response({
        'total_puntos': puntos.puntos_totales,
        'promedio_precision': round(promedio_precision, 2),
        'total_ejercicios': total_ejercicios,
        'ejercicios_aprobados': ejercicios_aprobados,
        'ejercicios_completados': ejercicios_aprobados,
        'racha_dias': racha,
        'nivel_actual': nivel_actual,  
        'lecciones_completadas': lecciones_completadas,
        'total_lecciones': total_lecciones,
        'porcentaje_completado': porcentaje
    })


@api_view(['GET'])
def progreso_lecciones(request):
    """Obtiene el progreso del estudiante por lección"""
    estudiante_id = request.query_params.get('estudiante_id')
    
    if not estudiante_id:
        return Response({'error': 'Se requiere estudiante_id'}, status=400)
    
    try:
        estudiante_id = int(estudiante_id)
    except ValueError:
        return Response({'error': 'estudiante_id debe ser número'}, status=400)
    
    progreso = ProgresoUsuario.objects.filter(estudiante_id=estudiante_id)
    
    resultado = []
    for p in progreso:
        leccion_titulo = f"Lección {p.leccion_id}"
        try:
            leccion = Leccion.objects.get(id=p.leccion_id)
            leccion_titulo = leccion.titulo
        except:
            pass
        
        resultado.append({
            'leccion_id': p.leccion_id,
            'leccion_titulo': leccion_titulo,
            'completado': p.completado,
            'puntuacion': p.puntuacion,
            'precision': float(p.precision) if p.precision else 0,
            'intentos': p.intentos,
            'fecha': p.fecha.strftime('%Y-%m-%d %H:%M:%S') if p.fecha else ''
        })
    
    return Response(resultado)


@api_view(['GET'])
def evolucion_precision(request):
    """Obtiene la evolución de precisión del estudiante"""
    estudiante_id = request.query_params.get('estudiante_id')
    
    if not estudiante_id:
        return Response({'error': 'Se requiere estudiante_id'}, status=400)
    
    try:
        estudiante_id = int(estudiante_id)
    except ValueError:
        return Response({'error': 'estudiante_id debe ser número'}, status=400)
    
    intentos = IntentosEjercicio.objects.filter(
        estudiante_id=estudiante_id
    ).order_by('-fecha')[:30]
    
    resultado = []
    for intento in reversed(intentos):
        resultado.append({
            'fecha': intento.fecha.strftime('%Y-%m-%d'),
            'precision': float(intento.precision) if intento.precision else 0,
            'ejercicio_nombre': f'Ejercicio {intento.ejercicio_id}',
            'color': intento.resultado_color
        })
    
    return Response(resultado)


@api_view(['GET'])
def ranking_estudiantes(request):
    """Ranking de estudiantes por puntos totales"""
    limit = request.query_params.get('limit', 10)
    
    try:
        limit = int(limit)
    except ValueError:
        limit = 10
    
    ranking = PuntosUsuario.objects.order_by('-puntos_totales')[:limit]
    
    resultado = []
    for r in ranking:
        nombre_completo = f"Estudiante {r.estudiante_id}"
        try:
            from usuarios.models import Estudiante, Usuario
            estudiante = Estudiante.objects.get(id=r.estudiante_id)
            if estudiante.usuario:
                nombre_completo = f"{estudiante.usuario.nombre} {estudiante.usuario.apellido}"
        except:
            pass
        
        promedio = IntentosEjercicio.objects.filter(estudiante_id=r.estudiante_id).aggregate(avg=Avg('precision'))['avg'] or 0
        
        resultado.append({
            'id': r.estudiante_id,
            'nombre': nombre_completo,
            'apellido': '',
            'puntos_totales': r.puntos_totales,
            'promedio_precision': round(promedio, 2),
            'ejercicios_completados': IntentosEjercicio.objects.filter(estudiante_id=r.estudiante_id, resultado_color='verde').count()
        })
    
    return Response(resultado)