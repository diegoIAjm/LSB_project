# apps/evaluaciones/models.py

from django.db import models
from django.utils import timezone

class Evaluaciones(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('cerrado', 'Cerrado'),
        ('cancelado', 'Cancelado'),
    ]
    
    id = models.AutoField(primary_key=True)
    curso_id = models.IntegerField()
    docente_id = models.IntegerField()
    leccion_id = models.IntegerField()
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_limite = models.DateTimeField()  # Ahora es DateTime
    estado = models.CharField(max_length=50, default='activo', choices=ESTADO_CHOICES)
    tiempo_estimado_minutos = models.IntegerField(default=0)
    reintentos_permitidos = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'evaluaciones'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return self.titulo


class EvaluacionSenas(models.Model):
    id = models.AutoField(primary_key=True)
    evaluacion = models.ForeignKey(Evaluaciones, on_delete=models.CASCADE, related_name='senas')
    sena_id = models.IntegerField()
    orden = models.IntegerField(default=0)
    puntos_maximos = models.IntegerField(default=100)

    class Meta:
        db_table = 'evaluacion_senas'
        unique_together = ['evaluacion', 'sena_id']
        ordering = ['orden']

    def __str__(self):
        return f"Eval {self.evaluacion_id} - Sena {self.sena_id}"


class EntregasEvaluacion(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_progreso', 'En progreso'),
        ('completado', 'Completado'),
        ('revisado', 'Revisado'),
    ]
    
    id = models.AutoField(primary_key=True)
    evaluacion = models.ForeignKey(Evaluaciones, on_delete=models.CASCADE, related_name='entregas')
    estudiante_id = models.IntegerField()
    estado = models.CharField(max_length=50, default='pendiente', choices=ESTADO_CHOICES)
    intentos = models.IntegerField(default=0)
    fecha_inicio = models.DateTimeField(default=timezone.now)
    fecha_entrega = models.DateTimeField(null=True, blank=True)
    nota_final = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'entregas_evaluacion'
        unique_together = ['evaluacion', 'estudiante_id']

    def __str__(self):
        return f"Entrega {self.id} - Eval {self.evaluacion_id}"


class EntregasVideos(models.Model):
    id = models.AutoField(primary_key=True)
    entrega = models.ForeignKey(EntregasEvaluacion, on_delete=models.CASCADE, related_name='videos')
    evaluacion_sena = models.ForeignKey(EvaluacionSenas, on_delete=models.CASCADE, related_name='videos')
    sena_id = models.IntegerField()
    video_url = models.TextField()
    orden = models.IntegerField(default=0)
    fecha_subida = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'entregas_videos'
        ordering = ['orden']

    def __str__(self):
        return f"Video entrega {self.entrega_id} - Sena {self.sena_id}"


class ResultadosVideo(models.Model):
    COLOR_CHOICES = [
        ('verde', 'Verde'),
        ('amarillo', 'Amarillo'),
        ('rojo', 'Rojo'),
    ]
    
    id = models.AutoField(primary_key=True)
    entrega_video = models.OneToOneField(EntregasVideos, on_delete=models.CASCADE, related_name='resultado')
    precision = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    puntuacion = models.IntegerField(default=0)
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, null=True, blank=True)
    sena_detectada = models.CharField(max_length=100, null=True, blank=True)
    feedback = models.JSONField(default=dict, blank=True)
    keypoints = models.JSONField(default=dict, blank=True)
    fecha_evaluacion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'resultados_video'

    def __str__(self):
        return f"Resultado video {self.entrega_video_id}"


class EntregasResultados(models.Model):
    id = models.AutoField(primary_key=True)
    entrega = models.OneToOneField(EntregasEvaluacion, on_delete=models.CASCADE, related_name='resumen')
    nota_total = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    precision_promedio = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    videos_aprobados = models.IntegerField(default=0)
    videos_total = models.IntegerField(default=0)
    feedback_general = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'entregas_resultados'

    def __str__(self):
        return f"Resumen entrega {self.entrega_id}"