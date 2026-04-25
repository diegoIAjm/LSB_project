from django.db import models
from usuarios.models import Docente  # Importar Docente desde usuarios app
from duolingo.models import Nivel

class Curso(models.Model):
    MODALIDAD_CHOICES = [
        ('Virtual', 'Virtual'),
        ('Presencial', 'Presencial'),
    ]
    
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('finalizado', 'Finalizado'),
    ]
    
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    # 🔹 SOLO UN nivel, el ForeignKey
    nivel = models.ForeignKey(Nivel, on_delete=models.PROTECT, related_name='cursos')
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.CharField(max_length=50, default='activo', choices=ESTADO_CHOICES)
    modalidad = models.CharField(max_length=20, choices=MODALIDAD_CHOICES, default='Virtual')
    docente = models.ForeignKey(Docente, on_delete=models.SET_NULL, null=True, blank=True, related_name='cursos')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cursos'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nombre} ({self.nivel.nombre})"  # 🔹 Acceder al nombre del nivel

    def save(self, *args, **kwargs):
        if self.fecha_inicio and self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValueError("La fecha de fin no puede ser menor a la fecha de inicio")
        super().save(*args, **kwargs)

class Inscripcion(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('cancelado', 'Cancelado'),
        ('completado', 'Completado'),
    ]
    
    id = models.AutoField(primary_key=True)
    estudiante = models.ForeignKey('usuarios.Estudiante', on_delete=models.CASCADE, related_name='inscripciones')
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='inscripciones')
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=50, default='activo', choices=ESTADO_CHOICES)
    
    class Meta:
        db_table = 'inscripciones'
        unique_together = ['estudiante', 'curso']  # Evita duplicados

    def __str__(self):
        return f"{self.estudiante.usuario.nombre} - {self.curso.nombre}"
    

class Horario(models.Model):
    DIAS_CHOICES = [
        ('lunes', 'Lunes'),
        ('martes', 'Martes'),
        ('miercoles', 'Miércoles'),
        ('jueves', 'Jueves'),
        ('viernes', 'Viernes'),
        ('sabado', 'Sábado'),
        ('domingo', 'Domingo'),
    ]
    
    id = models.AutoField(primary_key=True)
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='horarios')
    dia = models.CharField(max_length=20, choices=DIAS_CHOICES)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    aula = models.CharField(max_length=100, blank=True, null=True)
    enlace_virtual = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'horarios'
        ordering = ['curso', 'dia', 'hora_inicio']
        unique_together = ['curso', 'dia', 'hora_inicio']  # Evita horarios duplicados
    
    def __str__(self):
        return f"{self.curso.nombre} - {self.dia} {self.hora_inicio}-{self.hora_fin}"
    