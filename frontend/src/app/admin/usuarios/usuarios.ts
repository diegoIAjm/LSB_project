import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario } from '../../services/usuarios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',   // 🔹 template en archivo separado
  styleUrls: ['./usuarios.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];

  mensajeExito: string = ''; // 🔹 <--- aquí se declara la propiedad

  // filtro para ngModel
  filtro = {
    nombre: '',
    rol: ''
  };

  paginaActual = 1;
  limite = 10;          // usuarios por página
  totalUsuarios = 0;

  constructor(
    private usuariosService: UsuariosService,
    private cd: ChangeDetectorRef,   // 🔹 para forzar actualización
    private router: Router           // 🔹 para navegación
  ) {}

  ngOnInit() {
    this.cargarUsuarios();

    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.mensajeExito = nav.extras.state['mensaje'] || '';
      setTimeout(() => this.mensajeExito = '', 8000);
    }
  }

  cargarUsuarios(filtros: any = {}, pagina: number = 1) {
    if (Object.keys(filtros).length === 0) filtros = this.filtro;

    if (filtros.rol !== null && filtros.rol !== '') filtros.rol = Number(filtros.rol);
    else delete filtros.rol;

    // 🔹 Enviar página y límite al servicio
    this.usuariosService.getUsuarios({ ...filtros, pagina, limite: this.limite }).subscribe(
      (res: any) => {
        this.usuarios = res.usuarios;         // lista de usuarios paginada
        this.totalUsuarios = res.total;       // total de usuarios para paginación
        this.paginaActual = pagina;
        this.cd.detectChanges();
      },
      error => console.error('Error al cargar usuarios', error)
    );
  }

  irACrearUsuario() {
    this.router.navigate(['/admin/usuarios/crear']);
  }

  limpiarFiltros() {
    this.filtro = { nombre: '', rol: '' };
    this.cargarUsuarios({}, 1);
  }

  siguientePagina() {
    const totalPaginas = Math.ceil(this.totalUsuarios / this.limite);
    if (this.paginaActual < totalPaginas) this.cargarUsuarios(this.filtro, this.paginaActual + 1);
  }

  anteriorPagina() {
    if (this.paginaActual > 1) this.cargarUsuarios(this.filtro, this.paginaActual - 1);
  }

  get totalPaginas(): number {
  return Math.ceil(this.totalUsuarios / this.limite);
}

}