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

interface VideoConIntento {
  id: number;
  sena_id: number;
  sena_nombre: string;
  video_url: string;
  fecha_subida: string;
  intento: number;
  resultado: {
    precision: number;
    puntuacion: number;
    color: string;
    feedback: any;
  } | null;
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
  
  entregaSeleccionada: EntregaDocente | null = null;
  mostrarModalVideo = false;

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
    
    const notas = completadas.filter(e => e.nota_final !== null).map(e => e.nota_final as number);
    const precisiones = completadas.filter(e => e.resumen?.precision_promedio !== null).map(e => e.resumen?.precision_promedio as number);
    
    let totalVideos = 0;
    let videosAprobados = 0;
    
    this.entregas.forEach(entrega => {
      if (entrega.resumen) {
        totalVideos += entrega.resumen.videos_total || 0;
        videosAprobados += entrega.resumen.videos_aprobados || 0;
      }
    });
    
    this.estadisticas = {
      totalEvaluaciones: this.entregas.length,
      evaluacionesCompletadas: completadas.length,
      evaluacionesPendientes: pendientes.length,
      promedioGeneral: notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0,
      precisionPromedio: precisiones.length > 0 ? precisiones.reduce((a, b) => a + b, 0) / precisiones.length : 0,
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
    this.entregaSeleccionada = entrega;
    this.mostrarModalVideo = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModalVideo = false;
    this.entregaSeleccionada = null;
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

  getFeedbackGeneral(entrega: EntregaDocente): string {
    return entrega.resumen?.feedback_general || '';
  }

  getFeedbackMano(video: any): string {
    return video.resultado?.feedback?.mano || 'Mano';
  }

  getFeedbackMovimiento(video: any): string {
    return video.resultado?.feedback?.movimiento || 'Movimiento';
  }

  getVideoUrl(videoUrl: string): string {
    if (!videoUrl) return '';
    if (videoUrl.startsWith('http')) return videoUrl;
    if (videoUrl.startsWith('/')) return `http://127.0.0.1:8000/media${videoUrl}`;
    return `http://127.0.0.1:8000/media/${videoUrl}`;
  }

  // Métodos para agrupar videos por seña
  getVideosPorSena(entrega: EntregaDocente): { sena_nombre: string; videos: VideoConIntento[] }[] {
    if (!entrega.videos || entrega.videos.length === 0) return [];
    
    const videosPorSena: { [key: string]: VideoConIntento[] } = {};
    
    entrega.videos.forEach(video => {
      const nombreSena = video.sena_nombre || `Seña ${video.sena_id}`;
      if (!videosPorSena[nombreSena]) {
        videosPorSena[nombreSena] = [];
      }
      
      const intento = videosPorSena[nombreSena].length + 1;
      
      videosPorSena[nombreSena].push({
        ...video,
        intento: intento
      });
    });
    
    return Object.entries(videosPorSena).map(([sena_nombre, videos]) => ({
      sena_nombre,
      videos
    }));
  }

  esMejorIntento(video: VideoConIntento, todosLosVideos: VideoConIntento[]): boolean {
    if (!video.resultado) return false;
    const mejorPrecision = Math.max(...todosLosVideos.map(v => v.resultado?.precision || 0));
    return video.resultado.precision === mejorPrecision && mejorPrecision > 0;
  }
}