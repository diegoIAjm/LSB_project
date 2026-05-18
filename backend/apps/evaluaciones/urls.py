# apps/evaluaciones/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluacionViewSet, ResultadoEvaluacionViewSet, EntregaEvaluacionViewSet

router = DefaultRouter()
router.register(r'evaluaciones', EvaluacionViewSet, basename='evaluaciones')
router.register(r'resultados', ResultadoEvaluacionViewSet, basename='resultados')
router.register(r'entregas-evaluacion', EntregaEvaluacionViewSet, basename='entregas-evaluacion')

urlpatterns = [
    path('', include(router.urls)),
    path('entregas/entregar/', EntregaEvaluacionViewSet.as_view({'post': 'entregar_practica'}), name='entregar_practica'),
    path('entregas/<int:pk>/resultado/', EntregaEvaluacionViewSet.as_view({'get': 'obtener_resultado'}), name='obtener_resultado_entrega'),
    path('evaluar-rapido/', EntregaEvaluacionViewSet.as_view({'post': 'evaluar_rapido'}), name='evaluar_rapido'),
]