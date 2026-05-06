# apps/evaluaciones/models.py

from django.db import models

class Evaluaciones(models.Model):
    id = models.AutoField(primary_key=True)
    curso_id = models.IntegerField()
    docente_id = models.IntegerField()
    leccion_id = models.IntegerField()
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateField()
    fecha_limite = models.DateField()

    class Meta:
        db_table = 'evaluaciones'
        managed = False

    def __str__(self):
        return self.titulo


class EvaluacionSenas(models.Model):
    id = models.AutoField(primary_key=True)
    evaluacion_id = models.IntegerField()
    sena_id = models.IntegerField()
    orden = models.IntegerField()

    class Meta:
        db_table = 'evaluacion_senas'
        managed = False

    def __str__(self):
        return f"Eval {self.evaluacion_id} - Sena {self.sena_id}"


class EntregasEvaluacion(models.Model):
    id = models.AutoField(primary_key=True)
    evaluacion_id = models.IntegerField()
    estudiante_id = models.IntegerField()
    video_url = models.TextField()
    estado = models.CharField(max_length=50, default='pendiente')
    fecha_entrega = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'entregas_evaluacion'
        managed = False

    def __str__(self):
        return f"Entrega {self.id} - Eval {self.evaluacion_id}"


class ResultadosEvaluacion(models.Model):
    id = models.AutoField(primary_key=True)
    entrega_id = models.IntegerField()
    fecha_revision = models.DateTimeField(blank=True, null=True)
    nota = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    precision = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'resultados_evaluacion'
        managed = False

    def __str__(self):
        return f"Resultado entrega {self.entrega_id}"