from django.urls import path
from . import views
from .views import (
    NivelListView,
    UnidadListView,
    LeccionListView,
    EjercicioListView,
    ProgresoUsuarioView,
    PuntosUsuarioView,
    IntentosEjercicioView,
    EvaluarEjercicioView,
    CompletarLeccionView,
    SiguienteContenidoView,
    CompletarLeccionConLogrosView,
    LogrosUsuarioView,
    VerificarDesbloqueoLeccionView
)
from . import views_ia

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
    path('evaluar-sena-ia/', views_ia.evaluar_sena_duolingo, name='evaluar_sena_ia'),
    path('siguiente-contenido/', views.SiguienteContenidoView.as_view(), name='siguiente-contenido'),
    path('completar-leccion-logros/', views.CompletarLeccionConLogrosView.as_view(), name='completar-leccion-logros'),
    path('logros/<int:estudiante_id>/', views.LogrosUsuarioView.as_view(), name='logros-usuario'),
    path('leccion/<int:leccion_id>/desbloqueada/', views.VerificarDesbloqueoLeccionView.as_view(), name='verificar-desbloqueo'),
]