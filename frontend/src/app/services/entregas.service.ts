// src/app/services/entregas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';

export interface Entrega {
  id?: number;
  evaluacion_id: number;
  estudiante_id: number;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'revisado';
  fecha_inicio?: string;
  fecha_entrega?: string;
  nota_final?: number;
  intentos?: number;
  reintentos_permitidos?: number;
}

export interface EvaluacionIA {
  precision: number;
  sena_detectada: string;
  confianza: number;
  feedback: string;
  nota: number;
}

export interface ResultadoEntrega {
  message: string;
  entrega_id: number;
  resultado: EvaluacionIA;
  resultado_id: number;
}

export interface EntregaCompleta extends Entrega {
  resultado?: {
    nota: number;
    precision: number;
    observaciones: string;
    fecha_revision: string;
  };
}

// ========== NUEVAS INTERFACES ==========

export interface IniciarEntregaResponse {
  entrega_id: number;
  estado: string;
  senas_pendientes: {
    id: number;
    nombre: string;
    orden: number;
    evaluacion_sena_id: number;
  }[];
  total_senas: number;
}

export interface EntregarVideoResponse {
  message: string;
  video_id: number;
  resultado: {
    precision: number;
    puntuacion: number;
    color: string;
    sena_detectada: string;
    feedback: any;
  };
}

export interface ResultadoEntregaDetallado {
  entrega_id: number;
  estado: string;
  fecha_inicio: string;
  fecha_entrega: string | null;
  nota_final: number | null;
  precision_promedio?: number;
  videos_aprobados?: number;
  videos_total?: number;
  videos: {
    id: number;
    sena_id: number;
    video_url: string;
    fecha_subida: string;
    resultado: {
      precision: number;
      puntuacion: number;
      color: string;
      feedback: any;
    } | null;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class EntregasService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  // ========== MÉTODOS ACTUALIZADOS ==========

  // Iniciar una práctica (obtener señas pendientes)
  iniciarEntrega(evaluacionId: number, estudianteId: number): Observable<IniciarEntregaResponse> {
    return this.http.post<IniciarEntregaResponse>(`${this.apiUrl}/entregas/iniciar/`, {
      evaluacion_id: evaluacionId,
      estudiante_id: estudianteId
    });
  }

  // Entregar video de una seña específica
  entregarVideo(evaluacionId: number, estudianteId: number, senaId: number, videoFile: File): Observable<EntregarVideoResponse> {
    const formData = new FormData();
    formData.append('evaluacion_id', evaluacionId.toString());
    formData.append('estudiante_id', estudianteId.toString());
    formData.append('sena_id', senaId.toString());
    formData.append('video_file', videoFile);
    
    return this.http.post<EntregarVideoResponse>(`${this.apiUrl}/entregas/entregar-video/`, formData);
  }

  // Completar la práctica (finalizar)
  completarEntrega(entregaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/entregas/completar/`, { entrega_id: entregaId });
  }

  // Obtener resultado completo de una entrega
  getResultadoEntregaDetallado(entregaId: number): Observable<ResultadoEntregaDetallado> {
    return this.http.get<ResultadoEntregaDetallado>(`${this.apiUrl}/entregas/${entregaId}/resultado-completo/`);
  }

  // ========== MÉTODOS LEGACY (MANTENER POR COMPATIBILIDAD) ==========

  // Método legacy: marcar como entregado con URL
  marcarComoEntregado(evaluacionId: number, estudianteId: number, videoUrl: string): Observable<Entrega> {
    const entrega = {
      evaluacion_id: evaluacionId,
      estudiante_id: estudianteId,
      video_url: videoUrl,
      estado: 'entregado',
      fecha_entrega: new Date().toISOString()
    };
    return this.http.post<Entrega>(`${this.apiUrl}/entregas-evaluacion/`, entrega);
  }

  // Enviar video para evaluación con IA (legacy)
  entregarPracticaConVideo(evaluacionId: number, estudianteId: number, senaNombre: string, videoFile: File): Observable<ResultadoEntrega> {
    const formData = new FormData();
    formData.append('evaluacion_id', evaluacionId.toString());
    formData.append('estudiante_id', estudianteId.toString());
    formData.append('sena_nombre', senaNombre);
    formData.append('video', videoFile);
    
    return this.http.post<ResultadoEntrega>(`${this.apiUrl}/entregas/entregar/`, formData);
  }

  // Obtener estado de una entrega (actualizado)
  getEstadoEntrega(evaluacionId: number, estudianteId: number): Observable<Entrega | null> {
    let params = new HttpParams()
      .set('evaluacion_id', evaluacionId.toString())
      .set('estudiante_id', estudianteId.toString());
    
    return this.http.get<Entrega[]>(`${this.apiUrl}/entregas/`, { params })
      .pipe(
        map(entregas => {
          if (entregas && entregas.length > 0) {
            return entregas[0];
          }
          return null;
        })
      );
  }

  // Obtener resultado de una entrega específica por ID (legacy)
  getResultadoEntrega(entregaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/entregas/${entregaId}/resultado-completo/`);
  }

  // Obtener entrega completa con resultado
  getEntregaConResultado(evaluacionId: number, estudianteId: number): Observable<EntregaCompleta | null> {
    return this.getEstadoEntrega(evaluacionId, estudianteId).pipe(
      switchMap(entrega => {
        if (!entrega || !entrega.id) {
          return of(null);
        }
        return this.getResultadoEntrega(entrega.id).pipe(
          map((response: any) => {
            return {
              ...entrega,
              resultado: response.resultado || response
            };
          })
        );
      })
    );
  }
  reiniciarEntrega(evaluacionId: number, estudianteId: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/entregas/reiniciar/`, {
    evaluacion_id: evaluacionId,
    estudiante_id: estudianteId
  });
}
}