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
    estado = models.CharField(max_length=20, default= 'Activo')
    fecha_registro = models.DateTimeField(auto_now_add='True')

    class Meta:
        db_table = 'usuarios'

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.rol})"