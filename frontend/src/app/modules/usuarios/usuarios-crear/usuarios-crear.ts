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
    rol: 0,
    nivel_actual: '',
    especialidad: ''
  };

  mensaje = '';       // mensaje de confirmación local
  error = '';         // mensaje de error
  cargando = false;   // deshabilita botón mientras se crea
  niveles = ['Inicial', 'Avanzado'];

  constructor(
    private usuariosService: UsuariosService,
    private router: Router
  ) {}

  volverUsuarios() {
    this.router.navigate(['/admin/usuarios']);
  }
  mostrarCampoEspecifico(): boolean {
    return this.usuario.rol === 2 || this.usuario.rol === 3;
  }

crearUsuario() {
  this.mensaje = '';
  this.error = '';
  this.cargando = true;

  const { nombre, apellido, email, ci, password, rol, nivel_actual, especialidad } = this.usuario;

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

    if (rol === 3 && !nivel_actual) {
      this.error = 'Debe seleccionar un nivel para el estudiante';
      this.cargando = false;
      return;
    }

    if (rol === 2 && !especialidad) {
      this.error = 'Debe ingresar una especialidad para el docente';
      this.cargando = false;
      return;
    }

    // 🔹 Preparar datos para enviar
  const datosEnviar: any = {
    nombre: nombre,
    apellido: apellido,
    email: email,
    ci: ci,
    password: password,
    rol: Number(rol)  // Asegurar que sea número
  };

  if (rol === 3) {
    datosEnviar.nivel_actual = nivel_actual;
  } else if (rol === 2) {
    datosEnviar.especialidad = especialidad;
  }

  console.log('📤 Enviando al backend:', datosEnviar); // Debug

  // 🔹 Enviar al backend
  this.usuariosService.crearUsuario(datosEnviar).subscribe({
    next: (res: any) => {
      console.log('✅ Respuesta:', res);
      // Redirigir al listado con mensaje
      this.router.navigate(['/admin/usuarios'], { state: { mensaje: 'Usuario creado correctamente' } });
    },
      error: err => {
        console.error('❌ Error:', err); // Debug
        console.error('❌ Error response:', err.error); // Debug
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