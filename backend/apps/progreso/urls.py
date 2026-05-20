# apps/progreso/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('estadisticas/', views.estadisticas_estudiante, name='estadisticas_estudiante'),
    path('lecciones/', views.progreso_lecciones, name='progreso_lecciones'),
    path('evolucion/', views.evolucion_precision, name='evolucion_precision'),
    path('ranking/', views.ranking_estudiantes, name='ranking_estudiantes'),
]