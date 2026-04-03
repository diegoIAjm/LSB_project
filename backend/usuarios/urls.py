# usuarios/urls.py
from django.urls import path
from .views import UsuarioListView, UsuarioCreateView, UsuarioToggleEstadoView, UsuarioUpdateView
from .serializers import UsuarioCreateSerializer, UsuarioSerializer, UsuarioUpdateSerializer

urlpatterns = [
    path('usuarios/', UsuarioListView.as_view(), name='usuarios-list'),
    path('usuarios/crear/', UsuarioCreateView.as_view(), name='usuarios-crear'),
    path('usuarios/editar/<int:pk>/', UsuarioUpdateView.as_view(), name='usuario-update'),
    path('usuarios/<int:pk>/estado/', UsuarioToggleEstadoView.as_view(), name='usuario-estado'),
]