from django.db import models
from usuarios.models import Docente  # Importar Docente desde usuarios app

class Curso(models.Model):
    NIVEL_CHOICES = [
        ('basico', 'Básico'),
        ('avanzado', 'Avanzado'),
    ]
    
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('finalizado', 'Finalizado'),
    ]
    
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    nivel = models.CharField(max_length=50, choices=NIVEL_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.CharField(max_length=50, default='activo', choices=ESTADO_CHOICES)
    docente = models.ForeignKey(Docente, on_delete=models.SET_NULL, null=True, blank=True, related_name='cursos')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cursos'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nombre} ({self.nivel})"

    def save(self, *args, **kwargs):
        # Validar que fecha_fin sea mayor que fecha_inicio
        if self.fecha_inicio and self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValueError("La fecha de fin no puede ser menor a la fecha de inicio")
        super().save(*args, **kwargs)