import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario } from '../../../services/usuarios';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-usuarios-editar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-usuario.html',
  styleUrls: ['./editar-usuario.css']
})
export class UsuariosEditarComponent implements OnInit {
  usuario = {
    id: 0,
    nombre: '',
    apellido: '',
    email: '',
    ci: '',
    rol: 0, 
    nivel_actual: '',
    especialidad: ''
  };

  mensaje = '';
  error = '';
  cargando = false;
  cargandoDatos = true;
  niveles = ['Inicial', 'Avanzado'];

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef  // 🔹 AÑADIDO
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.cargarUsuario(id);
    } else {
      this.error = 'ID de usuario no proporcionado';
      this.cargandoDatos = false;
      this.cd.detectChanges();  // 🔹 AÑADIDO
    }
  }

  mostrarCampoEspecifico(): boolean {
    return this.usuario.rol === 2 || this.usuario.rol === 3;
  }

  cargarUsuario(id: number): void {
    this.cargandoDatos = true;
    this.cd.detectChanges();  // 🔹 AÑADIDO
    console.log('1. cargandoDatos =', this.cargandoDatos);
    
    this.usuariosService.getUsuarios({ pagina: 1, limite: 1000 }).subscribe({
      next: (response: any) => {
        console.log('2. Respuesta recibida');
        if (response.usuarios) {
          const usuarioEncontrado = response.usuarios.find((u: any) => u.id === Number(id));
          
          if (usuarioEncontrado) {
            console.log('3. Nombre del rol recibido:', usuarioEncontrado.rol);
            
            let rolId = 0;
            switch(usuarioEncontrado.rol) {
              case 'admin':
              case 'Administrador':
                rolId = 1;
                break;
              case 'docente':
              case 'Docente':
                rolId = 2;
                break;
              case 'estudiante':
              case 'Estudiante':
                rolId = 3;
                break;
              default:
                rolId = !isNaN(parseInt(usuarioEncontrado.rol)) ? parseInt(usuarioEncontrado.rol) : 0;
            }
            
            console.log('4. Rol asignado:', rolId);
            
            this.usuario = {
              id: usuarioEncontrado.id,
              nombre: usuarioEncontrado.nombre,
              apellido: usuarioEncontrado.apellido,
              email: usuarioEncontrado.email,
              ci: usuarioEncontrado.ci ||'',
              rol: rolId,
              nivel_actual: usuarioEncontrado.nivel_actual || '',
              especialidad: usuarioEncontrado.especialidad || ''
            };
            
            console.log('5. Usuario cargado:', this.usuario);
            console.log('6. Antes de setear cargandoDatos = false');
            this.cargandoDatos = false;
            this.cd.detectChanges();  // 🔹 AÑADIDO - Forzar actualización de la vista
            console.log('7. cargandoDatos ahora es:', this.cargandoDatos);
          } else {
            this.error = 'Usuario no encontrado';
            this.cargandoDatos = false;
            this.cd.detectChanges();  
          }
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.error = 'Error al cargar los datos del usuario';
        this.cargandoDatos = false;
        this.cd.detectChanges();  // 🔹 AÑADIDO
      }
    });
  }

  volverUsuarios() {
    this.router.navigate(['/admin/usuarios']);
  }

  actualizarUsuario() {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;
    this.cd.detectChanges();  // 🔹 AÑADIDO

    const { nombre, apellido, email, ci, rol, nivel_actual, especialidad } = this.usuario;

    const nombreApellidoRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const ciRegex = /^[0-9]{5,15}$/;

    if (!nombre || !apellido || !email || !ci || !rol) {
      this.error = 'Todos los campos son obligatorios';
      this.cargando = false;
      this.cd.detectChanges();  // 🔹 AÑADIDO
      return;
    }

    if (!nombreApellidoRegex.test(nombre)) {
      this.error = 'El nombre debe tener solo letras y entre 2 y 50 caracteres';
      this.cargando = false;
      this.cd.detectChanges();  // 🔹 AÑADIDO
      return;
    }

    if (!nombreApellidoRegex.test(apellido)) {
      this.error = 'El apellido debe tener solo letras y entre 2 y 50 caracteres';
      this.cargando = false;
      this.cd.detectChanges();  // 🔹 AÑADIDO
      return;
    }

    if (!emailRegex.test(email)) {
      this.error = 'Ingrese un correo electrónico válido';
      this.cargando = false;
      this.cd.detectChanges();  // 🔹 AÑADIDO
      return;
    }

    if (!ciRegex.test(ci)) {
      this.error = 'El CI debe contener solo números y entre 5 y 15 dígitos';
      this.cargando = false;
      this.cd.detectChanges();
      return;
    }

        if (rol === 3 && !nivel_actual) {
      this.error = 'Debe seleccionar un nivel para el estudiante';
      this.cargando = false;
      this.cd.detectChanges();
      return;
    }

    if (rol === 2 && !especialidad) {
      this.error = 'Debe ingresar una especialidad para el docente';
      this.cargando = false;
      this.cd.detectChanges();
      return;
    }

    const usuarioData: any = {
      nombre: this.usuario.nombre,
      apellido: this.usuario.apellido,
      email: this.usuario.email,
      ci: this.usuario.ci,
      rol: this.usuario.rol
    };

    if (rol === 3) {
      usuarioData.nivel_actual = nivel_actual;
    } else if (rol === 2) {
      usuarioData.especialidad = especialidad;
    }

    this.usuariosService.editarUsuario(this.usuario.id, usuarioData).subscribe({
      next: (res: any) => {
        this.router.navigate(['/admin/usuarios'], { 
          state: { mensaje: 'Usuario actualizado correctamente' } 
        });
      },
      error: (err) => {
        if (err.error?.email) {
          this.error = err.error.email;
        }else if (err.error?.ci){ 
          this.error = err.error.ci;
        } else if (err.error?.nombre) {
          this.error = err.error.nombre;
        } else if (err.error?.apellido) {
          this.error = err.error.apellido;
        } else {
          this.error = err.error?.mensaje || 'Error al actualizar usuario';
        }
        this.cargando = false;
        this.cd.detectChanges();  // 🔹 AÑADIDO
      }
    });
  }
}