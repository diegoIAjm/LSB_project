# apps/senas/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import CategoriaViewSet

router = DefaultRouter()
router.register(r'senas', views.SenaViewSet, basename='senas')
router.register(r'categorias', CategoriaViewSet, basename='categorias')

urlpatterns = [
    path('', include(router.urls)),
]