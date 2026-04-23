from django.urls import path
from . import views

urlpatterns = [
    path('', views.grabacion_view, name='grabacion'),
    path('guardar-video/', views.guardar_video, name='guardar_video'),
    path('guardar-keypoints/', views.guardar_keypoints, name='guardar_keypoints'),  # 🔹 NUEVO
]