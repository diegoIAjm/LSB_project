# apps/senas/apps.py
from django.apps import AppConfig

class SenasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.senas'
    label = 'senas'
    verbose_name = 'Señas'