from django.urls import path
from .views import (
    NivelListView,
    UnidadListView,
    LeccionListView,
    EjercicioListView,
    ProgresoUsuarioView,
    PuntosUsuarioView,
    IntentosEjercicioView,
    EvaluarEjercicioView,
    CompletarLeccionView
)

urlpatterns = [
    path('niveles/', NivelListView.as_view(), name='niveles'),
    path('unidades/', UnidadListView.as_view(), name='unidades'),
    path('lecciones/', LeccionListView.as_view(), name='lecciones'),
    path('ejercicios/', EjercicioListView.as_view(), name='ejercicios'),
    path('progreso/', ProgresoUsuarioView.as_view(), name='progreso'),
    path('puntos/', PuntosUsuarioView.as_view(), name='puntos'),
    path('intentos/', IntentosEjercicioView.as_view(), name='intentos'),
    path('evaluar-ejercicio/', EvaluarEjercicioView.as_view(), name='evaluar-ejercicio'),
    path('completar-leccion/', CompletarLeccionView.as_view(), name='completar-leccion'),
]