# apps/ia_admin/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('entrenar/', views.entrenar_sena_admin, name='entrenar_sena_admin'),
]