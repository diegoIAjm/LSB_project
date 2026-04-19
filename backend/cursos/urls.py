from django.urls import path
from .views import (
    CursoListView,
    CursoCreateView,
    CursoDetailView,
    CursoUpdateView,
    CursoDeleteView,
    CursoToggleEstadoView,
    DocentesDisponiblesView,
    EstudiantesDisponiblesView,
    InscripcionCancelarView,
    InscripcionCreateView,
    InscripcionListView,
    CursosDisponiblesView,
    CursosActivosView,
    InscripcionMasivaView,
    CursoEstudiantesView
)

urlpatterns = [
    path('cursos/', CursoListView.as_view(), name='curso-list'),
    path('cursos/crear/', CursoCreateView.as_view(), name='curso-create'),
    path('cursos/<int:pk>/', CursoDetailView.as_view(), name='curso-detail'),
    path('cursos/editar/<int:pk>/', CursoUpdateView.as_view(), name='curso-update'),
    path('cursos/eliminar/<int:pk>/', CursoDeleteView.as_view(), name='curso-delete'),
    path('cursos/toggle-estado/<int:pk>/', CursoToggleEstadoView.as_view(), name='curso-toggle-estado'),
    path('docentes/disponibles/', DocentesDisponiblesView.as_view(), name='docentes-disponibles'),
    path('estudiantes/disponibles/', EstudiantesDisponiblesView.as_view(), name='estudiantes-disponibles'),
    path('cursos/disponibles/', CursosDisponiblesView.as_view(), name='cursos-disponibles'),
    path('cursos/activos/', CursosActivosView.as_view(), name='cursos-activos'),
    path('inscripciones/', InscripcionListView.as_view(), name='inscripciones-list'),
    path('inscripciones/', InscripcionCreateView.as_view(), name='inscripciones-create'),
    path('inscripciones/masivo/', InscripcionMasivaView.as_view(), name='inscripciones-masivo'),
    path('inscripciones/<int:pk>/cancelar/', InscripcionCancelarView.as_view(), name='inscripciones-cancelar'),
    path('cursos/<int:pk>/estudiantes/', CursoEstudiantesView.as_view(), name='curso-estudiantes'),
]