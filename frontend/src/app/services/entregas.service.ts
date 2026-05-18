// src/app/services/entregas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';

export interface Entrega {
  id?: number;
  evaluacion_id: number;
  estudiante_id: number;
  video_url: string;
  estado: 'pendiente' | 'entregado' | 'revisado';
  fecha_entrega?: string;
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

@Injectable({
  providedIn: 'root'
})
export class EntregasService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

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

  // Enviar video para evaluación con IA
  entregarPracticaConVideo(evaluacionId: number, estudianteId: number, senaNombre: string, videoFile: File): Observable<ResultadoEntrega> {
    const formData = new FormData();
    formData.append('evaluacion_id', evaluacionId.toString());
    formData.append('estudiante_id', estudianteId.toString());
    formData.append('sena_nombre', senaNombre);
    formData.append('video', videoFile);
    
    return this.http.post<ResultadoEntrega>(`${this.apiUrl}/entregas/entregar/`, formData);
  }

  // Obtener estado de una entrega
  getEstadoEntrega(evaluacionId: number, estudianteId: number): Observable<Entrega | null> {
    return this.http.get<Entrega[]>(`${this.apiUrl}/entregas-evaluacion/?evaluacion_id=${evaluacionId}&estudiante_id=${estudianteId}`)
      .pipe(
        map(entregas => {
          if (entregas && entregas.length > 0) {
            return entregas[0];
          }
          return null;
        })
      );
  }

  // Obtener resultado de una entrega específica por ID
  getResultadoEntrega(entregaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/entregas-evaluacion/${entregaId}/resultado/`);
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
              resultado: response.resultado
            };
          })
        );
      })
    );
  }
}