# apps/senas/models.py
from django.db import models

class CategoriasSenas(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'categorias_senas'
        managed = False

    def __str__(self):
        return self.nombre


class Senas(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    categoria_id = models.IntegerField()
    video_url = models.TextField(blank=True, null=True)
    modelo_ruta = models.TextField(blank=True, null=True)  # Ruta al modelo .h5 entrenado

    class Meta:
        db_table = 'senas'
        managed = False

    def __str__(self):
        return self.nombre


class LeccionSenas(models.Model):
    leccion_id = models.IntegerField()
    sena_id = models.IntegerField()

    class Meta:
        db_table = 'leccion_senas'
        managed = False
        unique_together = (('leccion_id', 'sena_id'),)

    def __str__(self):
        return f"Lección {self.leccion_id} - Seña {self.sena_id}"