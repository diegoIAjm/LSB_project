from django.urls import path
from .views import (
    CursoListView,
    CursoCreateView,
    CursoDetailView,
    CursoUpdateView,
    CursoDeleteView,
    CursoToggleEstadoView,
    DocentesDisponiblesView
)

urlpatterns = [
    path('cursos/', CursoListView.as_view(), name='curso-list'),
    path('cursos/crear/', CursoCreateView.as_view(), name='curso-create'),
    path('cursos/<int:pk>/', CursoDetailView.as_view(), name='curso-detail'),
    path('cursos/editar/<int:pk>/', CursoUpdateView.as_view(), name='curso-update'),
    path('cursos/eliminar/<int:pk>/', CursoDeleteView.as_view(), name='curso-delete'),
    path('cursos/toggle-estado/<int:pk>/', CursoToggleEstadoView.as_view(), name='curso-toggle-estado'),
    path('docentes/disponibles/', DocentesDisponiblesView.as_view(), name='docentes-disponibles'),
]