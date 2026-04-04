from django.db import models

class Rol(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.nombre  


class Usuario(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    email = models.CharField(max_length=150)
    password = models.TextField()
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='rol_id')
    foto = models.TextField(null=True, blank=True)
    ci = models.CharField(max_length=150)
    estado = models.CharField(max_length=20, default= 'Activo')
    fecha_registro = models.DateTimeField(auto_now_add='True')

    class Meta:
        db_table = 'usuarios'

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.rol})"
    

class Estudiante(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='estudiante')
    nivel_actual = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'estudiantes'

    def __str__(self):
        return f"Estudiante: {self.usuario.nombre} {self.usuario.apellido}"

# 🔹 MODELO DOCENTE (para futuro)
class Docente(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='docente')
    especialidad = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'docentes'

    def __str__(self):
        return f"Docente: {self.usuario.nombre} {self.usuario.apellido}"