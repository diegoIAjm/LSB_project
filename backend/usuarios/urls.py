# usuarios/urls.py
from django.urls import path
from .views import UsuarioListView, UsuarioCreateView, UsuarioToggleEstadoView, UsuarioUpdateView, ImportarEstudiantesView, ImportarDocentesView
from .serializers import UsuarioCreateSerializer, UsuarioSerializer, UsuarioUpdateSerializer, ImportacionResponseSerializer

urlpatterns = [
    path('usuarios/', UsuarioListView.as_view(), name='usuarios-list'),
    path('usuarios/crear/', UsuarioCreateView.as_view(), name='usuarios-crear'),
    path('usuarios/editar/<int:pk>/', UsuarioUpdateView.as_view(), name='usuario-update'),
    path('usuarios/<int:pk>/estado/', UsuarioToggleEstadoView.as_view(), name='usuario-estado'),
    path('usuarios/importar/estudiantes/', ImportarEstudiantesView.as_view(), name='importar-estudiantes'),
    path('usuarios/importar/docentes/', ImportarDocentesView.as_view(), name='importar-docentes'),
]