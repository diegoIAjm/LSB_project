from django.urls import path
from .views import (
    MaterialListView,
    MaterialCreateView,
    MaterialDetailView,
    MaterialUpdateView,
    MaterialDeleteView
)

urlpatterns = [
    path('materiales/', MaterialListView.as_view(), name='materiales-list'),
    path('materiales/crear/', MaterialCreateView.as_view(), name='materiales-create'),
    path('materiales/<int:pk>/', MaterialDetailView.as_view(), name='materiales-detail'),
    path('materiales/editar/<int:pk>/', MaterialUpdateView.as_view(), name='materiales-update'),
    path('materiales/eliminar/<int:pk>/', MaterialDeleteView.as_view(), name='materiales-delete'),
]