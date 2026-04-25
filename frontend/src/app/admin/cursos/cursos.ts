// cursos.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CursosService, Curso, Nivel } from '../../services/cursos.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cursos.html',
  styleUrls: ['./cursos.css']
})
export class CursosComponent implements OnInit {
  cursos: Curso[] = [];
  niveles: Nivel[] = [];  // 👈 NUEVO: Array de niveles desde la API
  mensajeExito: string = '';
  
  filtro = {
    nivel: '',
    estado: '',
    modalidad: ''
  };
  
  // 👈 ELIMINADO: niveles fijos (ahora vienen de la API)
  // niveles = [
  //   { value: '', label: 'Todos los niveles' },
  //   { value: 'basico', label: 'Básico' },
  //   { value: 'avanzado', label: 'Avanzado' }
  // ];
  
  estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'finalizado', label: 'Finalizado' }
  ];

  constructor(
    private cursosService: CursosService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarNiveles();  // 👈 NUEVO: Cargar niveles primero
    this.cargarCursos();
    
    const historyState = history.state;
    if (historyState && historyState.mensaje) {
      this.mensajeExito = historyState.mensaje;
      setTimeout(() => {
        this.mensajeExito = '';
        this.cd.detectChanges();
      }, 5000);
      history.replaceState({}, '');
    }
  }

  // 👈 NUEVO: Cargar niveles desde la API
  cargarNiveles() {
    this.cursosService.getNiveles().subscribe({
      next: (data: Nivel[]) => {
        this.niveles = data;
        console.log('Niveles cargados:', this.niveles);
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar niveles', error);
      }
    });
  }

  cargarCursos() {
    const filtros: any = {};
    if (this.filtro.nivel) filtros.nivel = this.filtro.nivel;
    if (this.filtro.estado) filtros.estado = this.filtro.estado;
    if (this.filtro.modalidad) filtros.modalidad = this.filtro.modalidad;
    
    this.cursosService.getCursos(filtros).subscribe({
      next: (res: any) => {
        this.cursos = res.cursos;
        console.log('Cursos cargados:', this.cursos);
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar cursos', error);
      }
    });
  }

  limpiarFiltros() {
    this.filtro = { nivel: '', estado: '', modalidad: '' };
    this.cargarCursos();
  }

  irACrearCurso() {
    this.router.navigate(['/admin/cursos/crear']);
  }

  irAEditarCurso(id: number) {
    this.router.navigate(['/admin/cursos/editar', id]);
  }

  toggleEstado(curso: Curso) {
    const accion = curso.estado === 'activo' ? 'desactivar' : 'activar';
    const confirmar = confirm(`¿Seguro que deseas ${accion} el curso "${curso.nombre}"?`);
    if (!confirmar) return;

    this.cursosService.toggleEstado(curso.id).subscribe({
      next: (res: any) => {
        curso.estado = curso.estado === 'activo' ? 'inactivo' : 'activo';
        this.mensajeExito = res.mensaje;
        setTimeout(() => {
          this.mensajeExito = '';
          this.cd.detectChanges();
        }, 5000);
      },
      error: () => {
        this.mensajeExito = 'Error al cambiar estado';
        setTimeout(() => {
          this.mensajeExito = '';
          this.cd.detectChanges();
        }, 5000);
      }
    });
  }

  getEstadoClass(estado: string): string {
    switch(estado) {
      case 'activo': return 'estado-activo';
      case 'inactivo': return 'estado-inactivo';
      case 'finalizado': return 'estado-finalizado';
      default: return '';
    }
  }

  getEstadoTexto(estado: string): string {
    switch(estado) {
      case 'activo': return 'Activo';
      case 'inactivo': return 'Inactivo';
      case 'finalizado': return 'Finalizado';
      default: return estado;
    }
  }

  getNivelTexto(curso: Curso): string {
    return curso.nivel_nombre || 'Sin nivel';
  }
}