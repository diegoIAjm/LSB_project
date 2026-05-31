// src/app/teacher/curso-estudiantes/curso-estudiantes.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CursosService } from '../../services/cursos.service';

@Component({
  selector: 'app-curso-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './curso-estudiantes.html',
  styleUrls: ['./curso-estudiantes.css']
})
export class CursoEstudiantesComponent implements OnInit {
  cursoId: number = 0;
  cursoNombre: string = '';
  estudiantes: any[] = [];
  estudiantesFiltrados: any[] = [];
  cargando = true;
  
  filtroBusqueda = '';
  filtroEstado = '';
  
  estados = [
    { value: '', label: 'Todos' },
    { value: 'activo', label: 'Activos' },
    { value: 'cancelado', label: 'Cancelados' },
    { value: 'completado', label: 'Completados' }
  ];

  constructor(
    private cursosService: CursosService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cursoId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('ID del curso:', this.cursoId);
    this.cargarEstudiantes();
  }

  cargarEstudiantes(): void {
    this.cursosService.getEstudiantesByCurso(this.cursoId).subscribe({
      next: (res: any) => {
        console.log('Datos recibidos del backend:', res);
        
        this.estudiantes = [...res.estudiantes];
        this.estudiantesFiltrados = [...res.estudiantes];
        this.cursoNombre = res.curso_nombre;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarEstudiantes(): void {
    this.estudiantesFiltrados = [...this.estudiantes.filter(est => {
      if (this.filtroEstado && est.estado !== this.filtroEstado) {
        return false;
      }
      if (this.filtroBusqueda && !est.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase())) {
        return false;
      }
      return true;
    })];
    this.cdr.detectChanges();
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.filtroBusqueda = '';
    this.estudiantesFiltrados = [...this.estudiantes];
    this.cdr.detectChanges();
  }

  // ✅ Nueva función: Ver prácticas del estudiante
  verPracticas(estudianteId: number, estudianteNombre: string): void {
    this.router.navigate(['/teacher/estudiante-practicas', estudianteId], {
      queryParams: { 
        cursoId: this.cursoId,
        cursoNombre: this.cursoNombre,
        estudianteNombre: estudianteNombre 
      }
    });
  }

  volver(): void {
    this.router.navigate(['/teacher/mis-cursos']);
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

  get totalEstudiantes(): number {
    return this.estudiantes.length;
  }

  get estudiantesActivos(): number {
    return this.estudiantes.filter(e => e.estado === 'activo').length;
  }

  get estudiantesCancelados(): number {
    return this.estudiantes.filter(e => e.estado === 'cancelado').length;
  }

  get promedioProgreso(): number {
    if (this.estudiantes.length === 0) return 0;
    const suma = this.estudiantes.reduce((sum: number, e: any) => sum + (e.progreso || 0), 0);
    return Math.round(suma / this.estudiantes.length);
  }
}