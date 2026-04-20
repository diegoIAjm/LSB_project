from django.db import models
from usuarios.models import Estudiante

class Nivel(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'niveles'
        ordering = ['id']
    
    def __str__(self):
        return self.nombre

class Unidad(models.Model):
    id = models.AutoField(primary_key=True)
    nivel = models.ForeignKey(Nivel, on_delete=models.CASCADE, related_name='unidades')
    nombre = models.CharField(max_length=150)
    orden = models.IntegerField()
    
    class Meta:
        db_table = 'unidades'
        ordering = ['orden']
        unique_together = ['nivel', 'orden']
    
    def __str__(self):
        return f"{self.nivel.nombre} - {self.nombre}"

class Leccion(models.Model):
    id = models.AutoField(primary_key=True)
    unidad = models.ForeignKey(Unidad, on_delete=models.CASCADE, related_name='lecciones')
    titulo = models.CharField(max_length=150)
    orden = models.IntegerField()
    
    class Meta:
        db_table = 'lecciones'
        ordering = ['orden']
        unique_together = ['unidad', 'orden']
    
    def __str__(self):
        return self.titulo

class Sena(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    video_url = models.TextField(blank=True, null=True)
    modelo_referencia = models.TextField(blank=True, null=True)  # Ruta del modelo o keypoints
    
    class Meta:
        db_table = 'senas'
    
    def __str__(self):
        return self.nombre

class Ejercicio(models.Model):
    TIPO_CHOICES = [
        ('practica', 'Práctica'),
    ]
    
    TIPO_MODELO_CHOICES = [
        ('json_keypoints', 'JSON Keypoints'),
        ('modelo_rnn', 'Modelo RNN'),
        ('video_referencia', 'Video Referencia'),
    ]
    
    id = models.AutoField(primary_key=True)
    leccion = models.ForeignKey(Leccion, on_delete=models.CASCADE, related_name='ejercicios')
    tipo = models.CharField(max_length=50, default='practica', choices=TIPO_CHOICES)
    nivel = models.IntegerField(default=1)  # Dificultad 1-5
    pregunta = models.TextField()
    sena = models.ForeignKey(Sena, on_delete=models.SET_NULL, null=True, blank=True, related_name='ejercicios')
    es_examen = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)  # Datos adicionales
    modelo_referencia = models.TextField(blank=True, null=True)
    tipo_modelo = models.CharField(max_length=50, blank=True, null=True, choices=TIPO_MODELO_CHOICES)
    
    class Meta:
        db_table = 'ejercicios'
        ordering = ['nivel', 'id']
    
    def __str__(self):
        return f"{self.leccion.titulo} - {self.pregunta[:50]}"

class ProgresoUsuario(models.Model):
    id = models.AutoField(primary_key=True)
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='progreso_duolingo')
    leccion = models.ForeignKey(Leccion, on_delete=models.CASCADE, related_name='progresos')
    completado = models.BooleanField(default=False)
    puntuacion = models.IntegerField(default=0)
    precision = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    intentos = models.IntegerField(default=0)
    tiempo_total = models.IntegerField(default=0)  # segundos
    fecha = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'progreso_usuario'
        unique_together = ['estudiante', 'leccion']
    
    def __str__(self):
        return f"{self.estudiante.usuario.nombre} - {self.leccion.titulo}"

class PuntosUsuario(models.Model):
    id = models.AutoField(primary_key=True)
    estudiante = models.OneToOneField(Estudiante, on_delete=models.CASCADE, related_name='puntos_duolingo')
    puntos_totales = models.IntegerField(default=0)
    racha_dias = models.IntegerField(default=0)
    ultima_actividad = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'puntos_usuario'
    
    def __str__(self):
        return f"{self.estudiante.usuario.nombre} - {self.puntos_totales} pts"

class IntentosEjercicio(models.Model):
    COLOR_CHOICES = [
        ('verde', 'Verde'),
        ('amarillo', 'Amarillo'),
        ('rojo', 'Rojo'),
    ]
    
    id = models.AutoField(primary_key=True)
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='intentos_duolingo')
    ejercicio = models.ForeignKey(Ejercicio, on_delete=models.CASCADE, related_name='intentos')
    puntuacion = models.IntegerField(default=0)
    precision = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    resultado_color = models.CharField(max_length=10, choices=COLOR_CHOICES, null=True, blank=True)
    feedback = models.JSONField(default=dict, blank=True)  # Feedback detallado
    keypoints = models.JSONField(default=dict, blank=True)  # Keypoints capturados
    fecha = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'intentos_ejercicio'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"{self.estudiante.usuario.nombre} - Ej {self.ejercicio.id} - {self.fecha}"

class ActividadUsuario(models.Model):
    id = models.AutoField(primary_key=True)
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='actividades_duolingo')
    modulo = models.CharField(max_length=50)  # duolingo, diccionario, etc.
    accion = models.CharField(max_length=50)  # inicio_leccion, ejercicio_completado, etc.
    fecha = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'actividad_usuario'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"{self.estudiante.usuario.nombre} - {self.modulo} - {self.accion}"