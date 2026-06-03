// src/app/teacher/estudiante-practicas/estudiante-practicas.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluacionesService, EntregaDocente } from '../../services/evaluaciones.service';

interface EstadisticasGenerales {
  totalEvaluaciones: number;
  evaluacionesCompletadas: number;
  evaluacionesPendientes: number;
  promedioGeneral: number;
  precisionPromedio: number;
  videosTotales: number;
  videosAprobados: number;
}

@Component({
  selector: 'app-estudiante-practicas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiante-practicas.html',
  styleUrls: ['./estudiante-practicas.css']
})
export class EstudiantePracticasComponent implements OnInit {
  estudianteId: number = 0;
  estudianteNombre: string = '';
  cursoId: number = 0;
  cursoNombre: string = '';
  
  entregas: EntregaDocente[] = [];
  entregasFiltradas: EntregaDocente[] = [];
  cargando = true;
  filtroEstado: string = 'todos';
  filtroBusqueda: string = '';
  
  estadisticas: EstadisticasGenerales = {
    totalEvaluaciones: 0,
    evaluacionesCompletadas: 0,
    evaluacionesPendientes: 0,
    promedioGeneral: 0,
    precisionPromedio: 0,
    videosTotales: 0,
    videosAprobados: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionService: EvaluacionesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.estudianteId = Number(this.route.snapshot.paramMap.get('id'));
    this.cursoId = Number(this.route.snapshot.queryParams['cursoId']);
    this.cursoNombre = this.route.snapshot.queryParams['cursoNombre'] || '';
    this.estudianteNombre = this.route.snapshot.queryParams['estudianteNombre'] || '';
    
    if (this.estudianteId && this.cursoId) {
      this.cargarEntregas();
    } else {
      console.error('Faltan parámetros necesarios');
      this.cargando = false;
    }
  }

  cargarEntregas(): void {
    this.cargando = true;
    this.evaluacionService.getEntregasPorCurso(this.cursoId).subscribe({
      next: (data: EntregaDocente[]) => {
        this.entregas = data.filter(e => e.estudiante_id === this.estudianteId);
        this.entregasFiltradas = [...this.entregas];
        this.calcularEstadisticas();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando entregas:', error);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

calcularEstadisticas(): void {
  const completadas = this.entregas.filter(e => e.estado === 'revisado' || e.estado === 'completado');
  const pendientes = this.entregas.filter(e => e.estado === 'pendiente' || e.estado === 'en_progreso');
  
  // ✅ Convertir nota_final a número (puede venir como string)
  const notas = completadas
    .filter(e => e.nota_final !== null && e.nota_final !== undefined)
    .map(e => {
      const nota = typeof e.nota_final === 'string' ? parseFloat(e.nota_final) : (e.nota_final as number);
      return isNaN(nota) ? 0 : nota;
    });
  
  const precisiones = completadas
    .filter(e => e.resumen?.precision_promedio !== null)
    .map(e => e.resumen?.precision_promedio as number);
  
  let totalVideos = 0;
  let videosAprobados = 0;
  
  this.entregas.forEach(entrega => {
    if (entrega.resumen) {
      totalVideos += entrega.resumen.videos_total || 0;
      videosAprobados += entrega.resumen.videos_aprobados || 0;
    }
  });
  
  // ✅ Calcular promedio con números
  const promedioGeneral = notas.length > 0 
    ? notas.reduce((a, b) => a + b, 0) / notas.length 
    : 0;
  
  const precisionPromedio = precisiones.length > 0 
    ? precisiones.reduce((a, b) => a + b, 0) / precisiones.length 
    : 0;
  
  console.log('Notas convertidas:', notas);
  console.log('Promedio general calculado:', promedioGeneral);
  
  this.estadisticas = {
    totalEvaluaciones: this.entregas.length,
    evaluacionesCompletadas: completadas.length,
    evaluacionesPendientes: pendientes.length,
    promedioGeneral: promedioGeneral,
    precisionPromedio: precisionPromedio,
    videosTotales: totalVideos,
    videosAprobados: videosAprobados
  };
}

  filtrarEntregas(): void {
    let filtradas = [...this.entregas];
    
    if (this.filtroBusqueda && this.filtroBusqueda.trim() !== '') {
      filtradas = filtradas.filter(e => 
        e.evaluacion_titulo?.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
      );
    }
    
    if (this.filtroEstado !== 'todos') {
      filtradas = filtradas.filter(e => e.estado === this.filtroEstado);
    }
    
    this.entregasFiltradas = filtradas;
    this.cdr.detectChanges();
  }

verDetalleEntrega(entrega: EntregaDocente): void {
  console.log('Navegando a detalle con:', {
    entregaId: entrega.id,
    estudianteId: this.estudianteId,
    cursoId: this.cursoId,
    estudianteNombre: this.estudianteNombre,
    cursoNombre: this.cursoNombre
  });
  
  this.router.navigate(['/teacher/detalle-practica', entrega.id], {
    queryParams: {
      estudianteId: this.estudianteId,
      cursoId: this.cursoId,
      estudianteNombre: this.estudianteNombre,
      cursoNombre: this.cursoNombre
    }
  });
}

  volver(): void {
    this.router.navigate(['/teacher/curso-estudiantes', this.cursoId]);
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

  getColorClase(precision: number | null | undefined): string {
    const val = precision || 0;
    if (val >= 70) return 'verde';
    if (val >= 40) return 'amarillo';
    return 'rojo';
  }

  getNotaFinal(entrega: EntregaDocente): number {
    return entrega.nota_final || 0;
  }

  getPrecisionPromedio(entrega: EntregaDocente): number {
    return entrega.resumen?.precision_promedio || 0;
  }

  getVideosAprobados(entrega: EntregaDocente): number {
    return entrega.resumen?.videos_aprobados || 0;
  }

  getVideosTotal(entrega: EntregaDocente): number {
    return entrega.resumen?.videos_total || 0;
  }

  getPorcentajeProgreso(entrega: EntregaDocente): number {
    const total = this.getVideosTotal(entrega);
    if (total === 0) return 0;
    return (this.getVideosAprobados(entrega) / total) * 100;
  }

  verEstadisticas(): void {
  this.router.navigate(['/teacher/estadisticas-estudiante', this.estudianteId], {
    queryParams: {
      cursoId: this.cursoId,
      cursoNombre: this.cursoNombre,
      estudianteNombre: this.estudianteNombre
    }
  });
}

}