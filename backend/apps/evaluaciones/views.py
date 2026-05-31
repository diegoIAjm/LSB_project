# apps/evaluaciones/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from django.db.models import Avg, Sum, Count
from .models import (
    Evaluaciones, EvaluacionSenas, EntregasEvaluacion, 
    EntregasVideos, ResultadosVideo, EntregasResultados
)
from .serializers import (
    EvaluacionSerializer, EntregaEvaluacionSerializer, 
    EntregaVideoSerializer, CrearEntregaVideoSerializer,
    CompletarEntregaSerializer, ResultadoVideoSerializer
)


class EvaluacionViewSet(viewsets.ModelViewSet):
    queryset = Evaluaciones.objects.all().order_by('-fecha_creacion')
    serializer_class = EvaluacionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        docente_id = self.request.query_params.get('docente_id')
        curso_id = self.request.query_params.get('curso_id')
        estado = self.request.query_params.get('estado')

        if docente_id:
            queryset = queryset.filter(docente_id=docente_id)
        if curso_id:
            queryset = queryset.filter(curso_id=curso_id)
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        senas_ids = data.pop('senas', [])

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        evaluacion = serializer.save(fecha_creacion=timezone.now())

        for idx, sena_id in enumerate(senas_ids):
            EvaluacionSenas.objects.create(
                evaluacion=evaluacion,
                sena_id=sena_id,
                orden=idx + 1
            )

        return Response(
            self.get_serializer(evaluacion).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def entregas(self, request, pk=None):
        evaluacion = self.get_object()
        entregas = EntregasEvaluacion.objects.filter(evaluacion=evaluacion)
        serializer = EntregaEvaluacionSerializer(entregas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def estudiantes_pendientes(self, request, pk=None):
        evaluacion = self.get_object()
        
        ids_entregaron = EntregasEvaluacion.objects.filter(
            evaluacion=evaluacion
        ).values_list('estudiante_id', flat=True)
        
        from usuarios.models import Estudiante
        estudiantes_pendientes = Estudiante.objects.exclude(
            id__in=ids_entregaron
        )
        
        from usuarios.serializers import EstudianteSerializer
        serializer = EstudianteSerializer(estudiantes_pendientes, many=True)
        return Response(serializer.data)
    @action(detail=False, methods=['get'], url_path='docente/entregas')
    def docente_entregas(self, request):
        """Obtener entregas para el docente"""
        docente_id = request.query_params.get('docente_id')
        
        if not docente_id:
            return Response(
                {'error': 'Se requiere docente_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        entregas = EntregasEvaluacion.objects.filter(
            evaluacion__docente_id=docente_id
        ).order_by('-fecha_entrega')
        
        serializer = EntregaEvaluacionSerializer(entregas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='curso/(?P<curso_id>[^/.]+)/entregas')
    def entregas_por_curso(self, request, curso_id=None):
        """Obtener entregas de un curso específico"""
        entregas = EntregasEvaluacion.objects.filter(
            evaluacion__curso_id=curso_id
        ).order_by('-fecha_entrega')
        
        serializer = EntregaEvaluacionSerializer(entregas, many=True)
        return Response(serializer.data)


class EntregaEvaluacionViewSet(viewsets.ModelViewSet):
    queryset = EntregasEvaluacion.objects.all()
    serializer_class = EntregaEvaluacionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        evaluacion_id = self.request.query_params.get('evaluacion_id')
        estudiante_id = self.request.query_params.get('estudiante_id')
        
        if evaluacion_id:
            queryset = queryset.filter(evaluacion_id=evaluacion_id)
        if estudiante_id:
            queryset = queryset.filter(estudiante_id=estudiante_id)
            
        return queryset

    @action(detail=False, methods=['post'], url_path='iniciar')
    def iniciar_entrega(self, request):
        evaluacion_id = request.data.get('evaluacion_id')
        id_recibido = request.data.get('estudiante_id')
        
        print(f"=== INICIAR ENTREGA ===")
        print(f"evaluacion_id: {evaluacion_id}")
        print(f"id_recibido: {id_recibido}")
        
        if not evaluacion_id or not id_recibido:
            return Response(
                {'error': 'Faltan campos requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convertir a estudiante_id
        from usuarios.models import Estudiante
        estudiante_id = None
        
        estudiante = Estudiante.objects.filter(id=id_recibido).first()
        if estudiante:
            estudiante_id = estudiante.id
        
        if not estudiante_id:
            estudiante = Estudiante.objects.filter(usuario_id=id_recibido).first()
            if estudiante:
                estudiante_id = estudiante.id
        
        if not estudiante_id:
            return Response(
                {'error': f'No se encontró un estudiante para el ID {id_recibido}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            evaluacion = Evaluaciones.objects.get(id=evaluacion_id)
        except Evaluaciones.DoesNotExist:
            return Response(
                {'error': 'Evaluación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Buscar entrega existente
        entrega = EntregasEvaluacion.objects.filter(
            evaluacion=evaluacion,
            estudiante_id=estudiante_id
        ).first()
        
        if entrega:
            print(f"✅ Entrega encontrada: ID {entrega.id}, estado: {entrega.estado}, intentos: {entrega.intentos}")
            
            # ✅ Verificar si ya alcanzó el límite de intentos
            if entrega.intentos >= evaluacion.reintentos_permitidos:
                return Response({
                    'error': f'Has alcanzado el límite de intentos. Máximo {evaluacion.reintentos_permitidos} intento(s).',
                    'intentos_realizados': entrega.intentos,
                    'intentos_permitidos': evaluacion.reintentos_permitidos
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Reiniciar estado para nuevo intento (sin incrementar intentos)
            if entrega.estado in ['completado', 'revisado']:
                entrega.estado = 'en_progreso'
                entrega.fecha_entrega = None
                entrega.nota_final = None
                entrega.save()
                print(f"🔄 Práctica reiniciada para intento {entrega.intentos + 1} de {evaluacion.reintentos_permitidos}")
            elif entrega.estado == 'pendiente':
                entrega.estado = 'en_progreso'
                entrega.save()
            elif entrega.estado == 'en_progreso':
                print(f"✅ Entrega ya en progreso")
        else:
            # Crear nueva entrega
            entrega = EntregasEvaluacion.objects.create(
                evaluacion=evaluacion,
                estudiante_id=estudiante_id,
                estado='en_progreso',
                fecha_inicio=timezone.now(),
                intentos=1
            )
            print(f"✅ Nueva entrega creada: ID {entrega.id}, intentos: 1")
        
        # Siempre devolver todas las señas
        senas_pendientes = []
        senas_evaluacion = EvaluacionSenas.objects.filter(evaluacion=evaluacion).order_by('orden')
        
        for sena_eval in senas_evaluacion:
            from duolingo.models import Sena
            try:
                sena = Sena.objects.get(id=sena_eval.sena_id)
                senas_pendientes.append({
                    'id': sena_eval.sena_id,
                    'nombre': sena.nombre,
                    'orden': sena_eval.orden,
                    'evaluacion_sena_id': sena_eval.id
                })
            except:
                senas_pendientes.append({
                    'id': sena_eval.sena_id,
                    'nombre': f"Seña {sena_eval.sena_id}",
                    'orden': sena_eval.orden,
                    'evaluacion_sena_id': sena_eval.id
                })
        
        return Response({
            'entrega_id': entrega.id,
            'estado': entrega.estado,
            'senas_pendientes': senas_pendientes,
            'total_senas': senas_evaluacion.count(),
            'intentos_realizados': entrega.intentos,
            'intentos_permitidos': evaluacion.reintentos_permitidos
        })

    @action(detail=False, methods=['post'], url_path='entregar-video')
    def entregar_video(self, request):
        from .services.evaluacion_ia_service import EvaluacionIAService
        
        serializer = CrearEntregaVideoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        evaluacion_id = serializer.validated_data['evaluacion_id']
        id_recibido = serializer.validated_data['estudiante_id']  # Puede ser usuario_id o estudiante_id
        sena_id = serializer.validated_data['sena_id']
        video_file = serializer.validated_data['video_file']
        
        print(f"=== ENTREGAR VIDEO ===")
        print(f"evaluacion_id: {evaluacion_id}")
        print(f"id_recibido: {id_recibido}")
        print(f"sena_id: {sena_id}")
        
        # ✅ Convertir a estudiante_id real (funciona con ambos casos)
        from usuarios.models import Estudiante
        estudiante_id = None
        
        # Primero, verificar si el ID recibido es un estudiante_id válido
        estudiante = Estudiante.objects.filter(id=id_recibido).first()
        if estudiante:
            estudiante_id = estudiante.id
            print(f"✅ El ID {id_recibido} es un estudiante_id válido")
        
        # Si no, verificar si es un usuario_id
        if not estudiante_id:
            estudiante = Estudiante.objects.filter(usuario_id=id_recibido).first()
            if estudiante:
                estudiante_id = estudiante.id
                print(f"✅ Convertido usuario_id {id_recibido} a estudiante_id {estudiante_id}")
        
        if not estudiante_id:
            return Response(
                {'error': f'No se encontró un estudiante para el ID {id_recibido}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            evaluacion = Evaluaciones.objects.get(id=evaluacion_id)
        except Evaluaciones.DoesNotExist:
            return Response(
                {'error': 'Evaluación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        from django.utils import timezone as tz
        
        if tz.is_naive(evaluacion.fecha_limite):
            fecha_limite = tz.make_aware(evaluacion.fecha_limite)
        else:
            fecha_limite = evaluacion.fecha_limite
        
        if tz.now() > fecha_limite:
            return Response(
                {'error': 'La práctica ya venció'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ✅ Buscar la entrega existente
        entrega = EntregasEvaluacion.objects.filter(
            evaluacion=evaluacion,
            estudiante_id=estudiante_id
        ).first()
        
        if not entrega:
            return Response(
                {'error': 'No se encontró una entrega para esta práctica'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        evaluacion_sena = EvaluacionSenas.objects.filter(
            evaluacion=evaluacion,
            sena_id=sena_id
        ).first()
        
        if not evaluacion_sena:
            return Response(
                {'error': 'Seña no encontrada en esta evaluación'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        import os
        
        extension = os.path.splitext(video_file.name)[1]
        path = f'entregas/evaluacion_{evaluacion_id}_estudiante_{estudiante_id}_sena_{sena_id}_{timezone.now().timestamp()}{extension}'
        saved_path = default_storage.save(path, ContentFile(video_file.read()))
        
        video = EntregasVideos.objects.create(
            entrega=entrega,
            evaluacion_sena=evaluacion_sena,
            sena_id=sena_id,
            video_url=saved_path,
            orden=evaluacion_sena.orden
        )
        
        resultado_ia = EvaluacionIAService.evaluar_video_entrega(video.id)
        
        if not resultado_ia.get('success'):
            return Response({
                'message': 'Video guardado, pero error en evaluación',
                'video_id': video.id,
                'error': resultado_ia.get('error')
            }, status=status.HTTP_200_OK)
        
        datos_resultado = resultado_ia.get('resultado', {})
        
        ResultadosVideo.objects.update_or_create(
            entrega_video=video,
            defaults={
                'precision': datos_resultado.get('precision'),
                'puntuacion': datos_resultado.get('puntuacion'),
                'color': datos_resultado.get('color'),
                'sena_detectada': datos_resultado.get('sena_detectada', ''),
                'feedback': datos_resultado.get('feedback', {})
            }
        )
        
        return Response({
            'message': 'Video entregado y evaluado correctamente',
            'video_id': video.id,
            'resultado': datos_resultado
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='completar')
    def completar_entrega(self, request):
        serializer = CompletarEntregaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        entrega_id = serializer.validated_data['entrega_id']
        
        try:
            entrega = EntregasEvaluacion.objects.get(id=entrega_id)
        except EntregasEvaluacion.DoesNotExist:
            return Response(
                {'error': 'Entrega no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        videos = EntregasVideos.objects.filter(entrega=entrega)
        
        if videos.count() == 0:
            return Response(
                {'error': 'No hay videos subidos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        resultados = ResultadosVideo.objects.filter(entrega_video__in=videos)
        
        total_puntuacion = resultados.aggregate(total=Sum('puntuacion'))['total'] or 0
        total_senas = resultados.count()
        nota_total = (total_puntuacion / (total_senas * 100)) * 20
        
        precision_promedio = resultados.aggregate(avg_precision=Avg('precision'))['avg_precision'] or 0
        videos_aprobados = resultados.filter(precision__gte=70).count()
        
        # ✅ Incrementar intentos al completar la práctica
        entrega.intentos += 1
        entrega.estado = 'completado'
        entrega.fecha_entrega = timezone.now()
        entrega.nota_final = nota_total
        entrega.save()
        
        EntregasResultados.objects.update_or_create(
            entrega=entrega,
            defaults={
                'nota_total': nota_total,
                'precision_promedio': precision_promedio,
                'videos_aprobados': videos_aprobados,
                'videos_total': total_senas,
                'feedback_general': f"Práctica completada. {videos_aprobados}/{total_senas} señas aprobadas."
            }
        )
        
        return Response({
            'message': 'Práctica completada',
            'entrega_id': entrega.id,
            'nota_final': float(nota_total),
            'precision_promedio': float(precision_promedio),
            'videos_aprobados': videos_aprobados,
            'videos_total': total_senas,
            'intentos_realizados': entrega.intentos,
            'intentos_permitidos': entrega.evaluacion.reintentos_permitidos
        })

    @action(detail=True, methods=['get'], url_path='resultado-completo')
    def resultado_completo(self, request, pk=None):
        entrega = self.get_object()
        
        videos = EntregasVideos.objects.filter(entrega=entrega).order_by('orden')
        videos_data = []
        
        for video in videos:
            resultado = ResultadosVideo.objects.filter(entrega_video=video).first()
            videos_data.append({
                'id': video.id,
                'sena_id': video.sena_id,
                'video_url': video.video_url,
                'fecha_subida': video.fecha_subida,
                'resultado': {
                    'precision': float(resultado.precision) if resultado else None,
                    'puntuacion': resultado.puntuacion if resultado else None,
                    'color': resultado.color if resultado else None,
                    'feedback': resultado.feedback if resultado else None
                } if resultado else None
            })
        
        return Response({
            'entrega_id': entrega.id,
            'estado': entrega.estado,
            'fecha_inicio': entrega.fecha_inicio,
            'fecha_entrega': entrega.fecha_entrega,
            'nota_final': float(entrega.nota_final) if entrega.nota_final else None,
            'videos': videos_data
        })
    
    @action(detail=False, methods=['post'], url_path='reiniciar')
    def reiniciar_entrega(self, request):
        evaluacion_id = request.data.get('evaluacion_id')
        id_recibido = request.data.get('estudiante_id')
        
        if not evaluacion_id or not id_recibido:
            return Response(
                {'error': 'Faltan campos requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convertir a estudiante_id
        from usuarios.models import Estudiante
        estudiante_id = None
        
        estudiante = Estudiante.objects.filter(id=id_recibido).first()
        if estudiante:
            estudiante_id = estudiante.id
        else:
            estudiante = Estudiante.objects.filter(usuario_id=id_recibido).first()
            if estudiante:
                estudiante_id = estudiante.id
        
        if not estudiante_id:
            return Response(
                {'error': f'No se encontró un estudiante para el ID {id_recibido}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            evaluacion = Evaluaciones.objects.get(id=evaluacion_id)
        except Evaluaciones.DoesNotExist:
            return Response(
                {'error': 'Evaluación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            entrega = EntregasEvaluacion.objects.get(
                evaluacion=evaluacion,
                estudiante_id=estudiante_id
            )
        except EntregasEvaluacion.DoesNotExist:
            return Response(
                {'error': 'No se encontró una entrega para esta práctica'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # ✅ NO incrementar intentos aquí, solo reiniciar estado
        # El incremento se hace en completar_entrega
        if entrega.intentos >= evaluacion.reintentos_permitidos:
            return Response({
                'error': f'Límite de intentos alcanzado',
                'intentos_realizados': entrega.intentos,
                'intentos_permitidos': evaluacion.reintentos_permitidos
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ Solo reiniciar estado, no incrementar intentos
        entrega.estado = 'pendiente'
        entrega.fecha_entrega = None
        entrega.nota_final = None
        entrega.save()
        
        # No eliminar videos para conservar historial
        return Response({
            'success': True,
            'entrega_id': entrega.id,
            'mensaje': 'Práctica reiniciada',
            'intentos_realizados': entrega.intentos,
            'intentos_restantes': evaluacion.reintentos_permitidos - entrega.intentos
        })


from rest_framework import viewsets
from .models import EntregasEvaluacion
from .serializers import EntregaEvaluacionSerializer

class CalificarEntregaView(APIView):
    """Endpoint para que el docente califique una entrega"""
    
    def post(self, request, entrega_id):
        nota = request.data.get('nota')
        observaciones = request.data.get('observaciones', '')
        
        if nota is None:
            return Response({'error': 'La nota es requerida'}, status=400)
        
        try:
            entrega = EntregasEvaluacion.objects.get(id=entrega_id)
        except EntregasEvaluacion.DoesNotExist:
            return Response({'error': 'Entrega no encontrada'}, status=404)
        
        # Actualizar nota
        entrega.nota_final = nota
        entrega.estado = 'revisado'
        entrega.save()
        
        # Guardar observaciones en resultados
        resultados, created = EntregasResultados.objects.update_or_create(
            entrega=entrega,
            defaults={
                'nota_total': nota,
                'feedback_general': observaciones
            }
        )
        
        return Response({
            'success': True,
            'mensaje': 'Calificación guardada correctamente',
            'nota': nota,
            'observaciones': observaciones
        })