# usuarios/urls.py
from django.urls import path
from .views import UsuarioListView, UsuarioCreateView
from .serializers import UsuarioCreateSerializer, UsuarioSerializer

urlpatterns = [
    path('usuarios/', UsuarioListView.as_view(), name='usuarios-list'),
    path('usuarios/crear/', UsuarioCreateView.as_view(), name='usuarios-crear'),
]