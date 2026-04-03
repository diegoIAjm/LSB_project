import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario } from '../../../services/usuarios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-crear.html',
  styleUrls: ['./usuarios-crear.css']
})
export class UsuariosCrearComponent {
  usuario = {
    nombre: '',
    apellido: '',
    email: '',
    ci:'',
    password: '',
    rol: 0
  };

  mensaje = '';       // mensaje de confirmación local
  error = '';         // mensaje de error
  cargando = false;   // deshabilita botón mientras se crea

  constructor(
    private usuariosService: UsuariosService,
    private router: Router
  ) {}

  volverUsuarios() {
    this.router.navigate(['/admin/usuarios']);
  }

crearUsuario() {
  this.mensaje = '';
  this.error = '';
  this.cargando = true;

  const { nombre, apellido, email, ci, password, rol } = this.usuario;

  // 🔹 Expresiones regulares
  const nombreApellidoRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ciRegex = /^[0-9]{5,15}$/;

  // 🔹 Validaciones
  if (!nombre || !apellido || !email || !ci || !password || !rol) {
    this.error = 'Todos los campos son obligatorios';
    this.cargando = false;
    return;
  }

  if (!nombreApellidoRegex.test(nombre)) {
    this.error = 'El nombre debe tener solo letras y entre 2 y 50 caracteres';
    this.cargando = false;
    return;
  }

  if (!nombreApellidoRegex.test(apellido)) {
    this.error = 'El apellido debe tener solo letras y entre 2 y 50 caracteres';
    this.cargando = false;
    return;
  }

  if (!emailRegex.test(email)) {
    this.error = 'Ingrese un correo electrónico válido';
    this.cargando = false;
    return;
  }

  if (!ciRegex.test(ci)) {
    this.error = 'El CI debe contener solo números y entre 5 y 15 dígitos';
    this.cargando = false;
    return;
  }

  if (password.length < 6) {
    this.error = 'La contraseña debe tener al menos 6 caracteres';
    this.cargando = false;
    return;
  }

  // 🔹 Enviar al backend
  this.usuariosService.crearUsuario(this.usuario).subscribe({
    next: (res: any) => {
      // Redirigir al listado con mensaje
      this.router.navigate(['/admin/usuarios'], { state: { mensaje: 'Usuario creado correctamente' } });
    },
      error: err => {
        // 🔹 Manejar errores específicos del backend
        if (err.error?.email) {
          this.error = err.error.email;
        } else if (err.error?.ci) {
          this.error = err.error.ci;
        } else {
          this.error = err.error?.mensaje || 'Error al crear usuario';
        }
        this.cargando = false;
      }
    });
}
}