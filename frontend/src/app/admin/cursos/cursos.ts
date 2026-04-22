import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CursosService, Curso } from '../../services/cursos.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cursos.html',
  styleUrls: ['./cursos.css']
})
export class CursosComponent implements OnInit {
  cursos: Curso[] = [];
  mensajeExito: string = '';
  
  filtro = {
    nivel: '',
    estado: '',
    modalidad: ''
  };
  
  niveles = [
    { value: '', label: 'Todos los niveles' },
    { value: 'basico', label: 'Básico' },
    { value: 'avanzado', label: 'Avanzado' }
  ];
  
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

  cargarCursos() {
    const filtros: any = {};
    if (this.filtro.nivel) filtros.nivel = this.filtro.nivel;
    if (this.filtro.estado) filtros.estado = this.filtro.estado;
    if (this.filtro.modalidad) filtros.modalidad = this.filtro.modalidad;
    
    this.cursosService.getCursos(filtros).subscribe({
      next: (res: any) => {
        this.cursos = res.cursos;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar cursos', error);
      }
    });
  }

  limpiarFiltros() {
    this.filtro = { nivel: '', estado: '', modalidad:'' };
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

  getNivelTexto(nivel: string): string {
    switch(nivel) {
      case 'basico': return 'Básico';
      case 'avanzado': return 'Avanzado';
      default: return nivel;
    }
  }
}