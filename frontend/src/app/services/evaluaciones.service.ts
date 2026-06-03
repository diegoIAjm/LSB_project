// src/app/services/evaluaciones.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Evaluacion {
  id?: number;
  curso_id: number;
  docente_id: number;
  leccion_id: number;
  titulo: string;
  descripcion: string;
  fecha_creacion?: string;
  fecha_limite: string;
  senas?: number[];
  senas_ids?: number[];
  curso_nombre?: string;
  leccion_titulo?: string;
  estado_entrega?: 'pendiente' | 'en_progreso' | 'completado' | 'revisado';
  entrega_id?: number;
  nota?: number;
  nota_final?: number;        
  precision?: number;
  feedback?: string;
  tiempo_estimado_minutos?: number;
  reintentos_permitidos?: number;
  intentos_realizados?: number;
  estado?: string;
  videos_aprobados?: number;
  videos_total?: number;
  resultado_detallado?: any;
}

export interface EntregaEvaluacion {
  id: number;
  evaluacion_id: number;
  estudiante_id: number;
  video_url: string;
  estado: 'pendiente' | 'entregado' | 'revisado';
  fecha_entrega?: string;
  estudiante_nombre?: string;
  estudiante_apellido?: string;
}

export interface ResultadoEvaluacion {
  id: number;
  entrega_id: number;
  fecha_revision: string;
  nota: number;
  precision: number;
  observaciones: string;
}

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

export interface CompletarEntregaResponse {
  message: string;
  entrega_id: number;
  nota_final: number;
  precision_promedio: number;
  videos_aprobados: number;
  videos_total: number;
}

export interface EntregaDocente {
  id: number;
  evaluacion_id: number;
  evaluacion_titulo: string;
  estudiante_id: number;
  estudiante_nombre: string;
  estudiante_apellido: string;
  evaluacion_descripcion?: string;
  estado: string;
  fecha_inicio: string;
  fecha_entrega: string | null;
  nota_final: number | null;
  intentos: number;
  reintentos_permitidos?: number;
  videos: EntregaVideoDocente[];
  senas_requeridas?: {  
    sena_id: number;
    sena_nombre: string;
    orden: number;
    puntos_maximos: number;
  }[];  
  resumen: {
    nota_total: number | null;
    precision_promedio: number | null;
    videos_aprobados: number;
    videos_total: number;
    feedback_general?: string;
  } | null;
}

export interface EntregaVideoDocente {
  id: number;
  sena_id: number;
  sena_nombre: string;
  video_url: string;
  fecha_subida: string;
  resultado: {
    precision: number;
    puntuacion: number;
    color: string;
    feedback: any;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluacionesService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  // ========== EVALUACIONES CRUD ==========
  getEvaluaciones(params?: { docente_id?: number; curso_id?: number; estado?: string }): Observable<Evaluacion[]> {
    let httpParams = new HttpParams();
    if (params?.docente_id) httpParams = httpParams.set('docente_id', params.docente_id);
    if (params?.curso_id) httpParams = httpParams.set('curso_id', params.curso_id);
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);
    
    return this.http.get<Evaluacion[]>(`${this.apiUrl}/evaluaciones/`, { params: httpParams });
  }

  getEvaluacion(id: number): Observable<Evaluacion> {
    return this.http.get<Evaluacion>(`${this.apiUrl}/evaluaciones/${id}/`);
  }

  createEvaluacion(evaluacion: Evaluacion): Observable<Evaluacion> {
    return this.http.post<Evaluacion>(`${this.apiUrl}/evaluaciones/`, evaluacion);
  }

  updateEvaluacion(id: number, evaluacion: Evaluacion): Observable<Evaluacion> {
    return this.http.put<Evaluacion>(`${this.apiUrl}/evaluaciones/${id}/`, evaluacion);
  }

  deleteEvaluacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/evaluaciones/${id}/`);
  }

  // ========== ENTREGAS ==========
  getEntregasByEvaluacion(evaluacionId: number): Observable<EntregaEvaluacion[]> {
    return this.http.get<EntregaEvaluacion[]>(`${this.apiUrl}/evaluaciones/${evaluacionId}/entregas/`);
  }

  // ========== NUEVOS MÉTODOS PARA ESTUDIANTE ==========
  
  // Iniciar una entrega (obtener señas pendientes)
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

  // Completar entrega (finalizar práctica)
  completarEntrega(entregaId: number): Observable<CompletarEntregaResponse> {
    return this.http.post<CompletarEntregaResponse>(`${this.apiUrl}/entregas/completar/`, {
      entrega_id: entregaId
    });
  }

  // Obtener resultado completo de una entrega
  getResultadoCompleto(entregaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/entregas/${entregaId}/resultado-completo/`);
  }


getEntregasPorCurso(cursoId: number): Observable<EntregaDocente[]> {
  return this.http.get<EntregaDocente[]>(`${this.apiUrl}/evaluaciones/curso/${cursoId}/entregas/`);
}

calificarEntrega(entregaId: number, nota: number, observaciones: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/evaluaciones/docente/calificar/${entregaId}/`, {
    nota: nota,
    observaciones: observaciones
  });
}

getSenasPorCurso(cursoId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/evaluaciones/curso/${cursoId}/senas/`);
}


}