// src/app/teacher/entregas-cursos/entregas-cursos.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluacionesService, EntregaDocente } from '../../services/evaluaciones.service';

@Component({
  selector: 'app-entregas-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entregas-cursos.html',
  styleUrls: ['./entregas-cursos.css']
})
export class EntregasCursosComponent implements OnInit {
  cursoId: number = 0;
  cursoNombre: string = '';
  entregas: EntregaDocente[] = [];
  entregasFiltradas: EntregaDocente[] = [];
  cargando = false;
  filtroEstado: string = 'todos';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionService: EvaluacionesService
  ) {}

  ngOnInit(): void {
    this.cursoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cursoNombre = this.route.snapshot.queryParams['cursoNombre'] || '';
    this.cargarEntregas();
  }

  cargarEntregas(): void {
    this.cargando = true;
    console.log('Cargando entregas para curso:', this.cursoId);
    this.evaluacionService.getEntregasPorCurso(this.cursoId).subscribe({
      next: (data) => {
        this.entregas = data;
        this.entregasFiltradas = [...data];
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando entregas:', error);
        this.cargando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/teacher/asignar-practica']);
  }

  getEstadoBadgeClass(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'en_progreso': return 'estado-progreso';
      case 'completado': return 'estado-completado';
      case 'revisado': return 'estado-revisado';
      default: return 'estado-pendiente';
    }
  }

  getEstadoTexto(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_progreso': return 'En progreso';
      case 'completado': return 'Completado';
      case 'revisado': return 'Revisado';
      default: return 'Pendiente';
    }
  }
}