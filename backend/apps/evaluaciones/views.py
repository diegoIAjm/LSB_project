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

        # Crear señas asociadas
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

            # Actualizar estado de la entrega
            entrega.estado = 'revisado'
            entrega.save()

            # Crear o actualizar resultado
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
        """Crear o actualizar una entrega (evitar duplicados)"""
        evaluacion_id = request.data.get('evaluacion_id')
        estudiante_id = request.data.get('estudiante_id')
        
        # Buscar si ya existe una entrega para esta evaluación y estudiante
        entrega_existente = EntregasEvaluacion.objects.filter(
            evaluacion_id=evaluacion_id,
            estudiante_id=estudiante_id
        ).first()
        
        if entrega_existente:
            # Actualizar la existente
            serializer = self.get_serializer(entrega_existente, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        
        # Crear nueva
        return super().create(request, *args, **kwargs)