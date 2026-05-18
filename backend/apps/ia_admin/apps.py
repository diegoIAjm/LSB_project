# apps/ia_admin/apps.py
from django.apps import AppConfig

class IaAdminConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ia_admin'
    label = 'ia_admin'
    verbose_name = 'Administración IA'