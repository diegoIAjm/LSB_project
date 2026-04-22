from django.apps import AppConfig

class IaAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ia_app'
    
    def ready(self):
        import ia_app.management.commands  # Registrar comandos