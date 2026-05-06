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
]