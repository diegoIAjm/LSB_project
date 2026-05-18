# apps/evaluaciones/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from .models import Evaluaciones, EvaluacionSenas, EntregasEvaluacion, ResultadosEvaluacion
from .serializers import (
    EvaluacionSerializer, EntregaEvaluacionSerializer, ResultadoEvaluacionSerializer
)

# Comenta temporalmente la importación del servicio IA si no está listo
# from .services.evaluacion_ia_service import EvaluacionIAService
# ia_service = EvaluacionIAService()


class EvaluacionViewSet(viewsets.ModelViewSet):
    queryset = Evaluaciones.objects.all().order_by('-fecha_creacion')
    serializer_class = EvaluacionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        docente_id = self.request.query_params.get('docente_id')
        curso_id = self.request.query_params.get('curso_id')

        if docente_id:
            queryset = queryset.filter(docente_id=docente_id)
        if curso_id:
            queryset = queryset.filter(curso_id=curso_id)

        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        senas_ids = data.pop('senas_ids', [])

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        evaluacion = serializer.save(fecha_creacion=timezone.now().date())

        for idx, sena_id in enumerate(senas_ids):
            EvaluacionSenas.objects.create(
                evaluacion_id=evaluacion.id,
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
        entregas = EntregasEvaluacion.objects.filter(evaluacion_id=evaluacion.id)
        serializer = EntregaEvaluacionSerializer(entregas, many=True)
        return Response(serializer.data)


class ResultadoEvaluacionViewSet(viewsets.ModelViewSet):
    queryset = ResultadosEvaluacion.objects.all()
    serializer_class = ResultadoEvaluacionSerializer

    @action(detail=False, methods=['post'])
    def calificar(self, request):
        entrega_id = request.data.get('entrega_id')
        nota = request.data.get('nota')
        precision = request.data.get('precision')
        observaciones = request.data.get('observaciones', '')

        try:
            entrega = EntregasEvaluacion.objects.get(id=entrega_id)
            entrega.estado = 'revisado'
            entrega.save()

            resultado, created = ResultadosEvaluacion.objects.update_or_create(
                entrega_id=entrega_id,
                defaults={
                    'fecha_revision': timezone.now(),
                    'nota': nota,
                    'precision': precision,
                    'observaciones': observaciones
                }
            )

            serializer = self.get_serializer(resultado)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except EntregasEvaluacion.DoesNotExist:
            return Response(
                {'error': 'Entrega no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )


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

    def create(self, request, *args, **kwargs):
        evaluacion_id = request.data.get('evaluacion_id')
        estudiante_id = request.data.get('estudiante_id')
        
        entrega_existente = EntregasEvaluacion.objects.filter(
            evaluacion_id=evaluacion_id,
            estudiante_id=estudiante_id
        ).first()
        
        if entrega_existente:
            serializer = self.get_serializer(entrega_existente, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='entregar')
    def entregar_practica(self, request):
        evaluacion_id = request.data.get('evaluacion_id')
        estudiante_id = request.data.get('estudiante_id')
        sena_nombre = request.data.get('sena_nombre')
        video_file = request.FILES.get('video')
        
        if not all([evaluacion_id, estudiante_id, sena_nombre, video_file]):
            return Response(
                {'error': 'Faltan campos requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            evaluacion = Evaluaciones.objects.get(id=evaluacion_id)
        except Evaluaciones.DoesNotExist:
            return Response(
                {'error': 'Evaluación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        entrega, created = EntregasEvaluacion.objects.get_or_create(
            evaluacion_id=evaluacion_id,
            estudiante_id=estudiante_id,
            defaults={
                'estado': 'entregado',
                'fecha_entrega': timezone.now()
            }
        )
        
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        import os
        
        extension = os.path.splitext(video_file.name)[1]
        path = f'entregas/evaluacion_{evaluacion_id}_estudiante_{estudiante_id}_{entrega.id}{extension}'
        saved_path = default_storage.save(path, ContentFile(video_file.read()))
        
        entrega.video_url = saved_path
        entrega.estado = 'entregado'
        entrega.fecha_entrega = timezone.now()
        entrega.save()
        
        # Resultado temporal (sin IA)
        resultado = {
            'precision': 85.5,
            'nota': 4.3,
            'feedback': '✅ Práctica recibida (evaluación pendiente)'
        }
        
        resultado_obj = ResultadosEvaluacion.objects.create(
            entrega_id=entrega.id,
            fecha_revision=timezone.now(),
            nota=resultado['nota'],
            precision=resultado['precision'],
            observaciones=resultado['feedback']
        )
        
        entrega.estado = 'revisado'
        entrega.save()
        
        return Response({
            'message': 'Práctica entregada correctamente',
            'entrega_id': entrega.id,
            'resultado': resultado,
            'resultado_id': resultado_obj.id
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='resultado')
    def obtener_resultado(self, request, pk=None):
        entrega = self.get_object()
        
        try:
            resultado = ResultadosEvaluacion.objects.get(entrega_id=entrega.id)
            return Response({
                'id': entrega.id,
                'evaluacion_id': entrega.evaluacion_id,
                'estudiante_id': entrega.estudiante_id,
                'estado': entrega.estado,
                'fecha_entrega': entrega.fecha_entrega,
                'video_url': entrega.video_url,
                'resultado': {
                    'nota': float(resultado.nota) if resultado.nota else 0,
                    'precision': float(resultado.precision) if resultado.precision else 0,
                    'observaciones': resultado.observaciones or '',
                    'fecha_revision': resultado.fecha_revision
                }
            })
        except ResultadosEvaluacion.DoesNotExist:
            return Response({
                'id': entrega.id,
                'evaluacion_id': entrega.evaluacion_id,
                'estudiante_id': entrega.estudiante_id,
                'estado': entrega.estado,
                'fecha_entrega': entrega.fecha_entrega,
                'video_url': entrega.video_url,
                'resultado': None
            })