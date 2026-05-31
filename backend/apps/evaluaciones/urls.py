# apps/evaluaciones/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluacionViewSet, EntregaEvaluacionViewSet, CalificarEntregaView

router = DefaultRouter()
router.register(r'evaluaciones', EvaluacionViewSet, basename='evaluaciones')
router.register(r'entregas', EntregaEvaluacionViewSet, basename='entregas')

urlpatterns = [
    path('', include(router.urls)),
    path('docente/calificar/<int:entrega_id>/', CalificarEntregaView.as_view(), name='calificar-entrega'),
]