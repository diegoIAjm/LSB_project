// src/app/teacher/detalle-practica/detalle-practica.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluacionesService, EntregaDocente } from '../../services/evaluaciones.service';

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
  selector: 'app-detalle-practica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-practica.html',
  styleUrls: ['./detalle-practica.css']
})
export class DetallePracticaComponent implements OnInit {
  entregaId: number = 0;
  entrega: EntregaDocente | null = null;
  cargando = true;
  estudianteNombre: string = '';
  cursoNombre: string = '';
  estudianteId: number = 0;
  cursoId: number = 0;
  errorCargando: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionService: EvaluacionesService,
    private cdr: ChangeDetectorRef  // ✅ Agregar ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.entregaId = Number(this.route.snapshot.paramMap.get('id'));
    
    this.estudianteId = Number(this.route.snapshot.queryParams['estudianteId']);
    this.cursoId = Number(this.route.snapshot.queryParams['cursoId']);
    this.estudianteNombre = this.route.snapshot.queryParams['estudianteNombre'] || '';
    this.cursoNombre = this.route.snapshot.queryParams['cursoNombre'] || '';
    
    console.log('Parámetros recibidos en detalle:', {
      entregaId: this.entregaId,
      estudianteId: this.estudianteId,
      cursoId: this.cursoId,
      estudianteNombre: this.estudianteNombre,
      cursoNombre: this.cursoNombre
    });
    
    if (this.entregaId) {
      this.cargarDetalle();
    } else {
      this.errorCargando = true;
      this.cargando = false;
      this.cdr.detectChanges(); // ✅ Forzar detección de cambios
    }
  }

  cargarDetalle(): void {
    this.cargando = true;
    this.errorCargando = false;
    this.cdr.detectChanges(); // ✅ Forzar detección de cambios
    
    console.log('Cargando detalle de entrega:', this.entregaId);
    
    this.evaluacionService.getResultadoCompleto(this.entregaId).subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', data);
        
        if (data) {
          this.entrega = data;
          console.log('Videos encontrados:', this.entrega?.videos?.length || 0);
        } else {
          console.warn('No se recibieron datos');
          this.errorCargando = true;
        }
        this.cargando = false;
        this.cdr.detectChanges(); // ✅ Forzar detección de cambios después de actualizar datos
      },
      error: (error) => {
        console.error('Error cargando detalle:', error);
        this.errorCargando = true;
        this.cargando = false;
        this.cdr.detectChanges(); // ✅ Forzar detección de cambios
      }
    });
  }

  volver(): void {
    if (this.estudianteId && this.cursoId) {
      this.router.navigate(['/teacher/estudiante-practicas', this.estudianteId], {
        queryParams: {
          cursoId: this.cursoId,
          cursoNombre: this.cursoNombre,
          estudianteNombre: this.estudianteNombre
        }
      });
    } else {
      this.router.navigate(['/teacher/curso-estudiantes', this.cursoId || 1]);
    }
  }

  reintentarCarga(): void {
    this.cargarDetalle();
  }

  getColorClase(precision: number | null | undefined): string {
    const val = precision || 0;
    if (val >= 70) return 'verde';
    if (val >= 40) return 'amarillo';
    return 'rojo';
  }

  getNotaFinal(): number {
    return this.entrega?.nota_final || 0;
  }

  getPrecisionPromedio(): number {
    return this.entrega?.resumen?.precision_promedio || 0;
  }

  getFeedbackGeneral(): string {
    return this.entrega?.resumen?.feedback_general || '';
  }

  getVideosPorSena(): { sena_nombre: string; videos: VideoConIntento[] }[] {
    if (!this.entrega?.videos || this.entrega.videos.length === 0) return [];
    
    const videosPorSena: { [key: string]: VideoConIntento[] } = {};
    
    this.entrega.videos.forEach(video => {
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

getDescripcion(): string {
  return (this.entrega as any)?.evaluacion_descripcion || '';
}

getSenasRequeridas(): { sena_id: number; sena_nombre: string; orden: number; puntos_maximos: number }[] {
  return (this.entrega as any)?.senas_requeridas || [];
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