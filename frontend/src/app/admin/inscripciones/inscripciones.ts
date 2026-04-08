import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CursosService } from '../../services/cursos.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inscripciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inscripciones.html',
  styleUrls: ['./inscripciones.css']
})
export class InscripcionesComponent implements OnInit {
  inscripciones: any[] = [];
  mensajeExito = '';
  error = '';
  
  filtro = {
    estado: ''
  };
  
  estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'activo', label: 'Activo' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'completado', label: 'Completado' }
  ];

  constructor(
    private cursosService: CursosService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarInscripciones();
    
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

  cargarInscripciones() {
    const filtros: any = {};
    if (this.filtro.estado) filtros.estado = this.filtro.estado;
    
    this.cursosService.getInscripciones(filtros).subscribe({
      next: (res: any) => {
        this.inscripciones = res.inscripciones;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar inscripciones', error);
      }
    });
  }

  limpiarFiltros() {
    this.filtro = { estado: '' };
    this.cargarInscripciones();
  }

  irInscribir() {
    this.router.navigate(['/admin/inscripciones/inscribir']);
  }

  toggleEstado(inscripcion: any) {
    const accion = inscripcion.estado === 'activo' ? 'cancelar' : 'activar';
    const confirmar = confirm(`¿Seguro que deseas ${accion} esta inscripción?`);
    if (!confirmar) return;

    this.cursosService.toggleEstadoInscripcion(inscripcion.id).subscribe({
      next: (res: any) => {
        inscripcion.estado = inscripcion.estado === 'activo' ? 'cancelado' : 'activo';
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
      case 'cancelado': return 'estado-cancelado';
      case 'completado': return 'estado-completado';
      default: return '';
    }
  }

  getEstadoTexto(estado: string): string {
    switch(estado) {
      case 'activo': return 'Activo';
      case 'cancelado': return 'Cancelado';
      case 'completado': return 'Completado';
      default: return estado;
    }
  }
}