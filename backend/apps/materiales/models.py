from django.db import models
from cursos.models import Curso

def material_upload_path(instance, filename):
    return f'materiales/curso_{instance.curso.id}/{filename}'

class Material(models.Model):
    TIPO_CHOICES = [
        ('pdf', 'PDF'),
        ('video', 'Video'),
        ('imagen', 'Imagen'),
        ('documento', 'Documento'),
    ]
    
    id = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=150)
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    archivo = models.FileField(upload_to=material_upload_path, null=True, blank=True)
    archivo_url = models.TextField(blank=True, null=True)
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='materiales')
    leccion_id = models.IntegerField(null=True, blank=True)
    fecha_subida = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'materiales'
        ordering = ['-fecha_subida']

    def __str__(self):
        return self.titulo