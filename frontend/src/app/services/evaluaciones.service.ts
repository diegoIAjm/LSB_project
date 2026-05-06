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
  senas_ids?: number[];
  curso_nombre?: string;
  leccion_titulo?: string;
  estado_entrega?: 'pendiente' | 'entregado' | 'revisado';
  entrega_id?: number;
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
  fehca_revision: string;
  nota: number;
  precision: number;
  observaciones: string;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluacionesService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  // ========== EVALUACIONES CRUD ==========
  getEvaluaciones(params?: { docente_id?: number; curso_id?: number }): Observable<Evaluacion[]> {
    let httpParams = new HttpParams();
    if (params?.docente_id) httpParams = httpParams.set('docente_id', params.docente_id);
    if (params?.curso_id) httpParams = httpParams.set('curso_id', params.curso_id);
    
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

  // ========== CALIFICACIONES ==========
  calificarEntrega(data: { entrega_id: number; nota: number; precision: number; observaciones: string }): Observable<ResultadoEvaluacion> {
    return this.http.post<ResultadoEvaluacion>(`${this.apiUrl}/resultados/calificar/`, data);
  }
}