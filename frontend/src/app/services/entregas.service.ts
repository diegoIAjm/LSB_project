// src/app/services/entregas.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Entrega {
  id?: number;
  evaluacion_id: number;
  estudiante_id: number;
  video_url: string;
  estado: 'pendiente' | 'entregado' | 'revisado';
  fecha_entrega?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EntregasService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  // Crear o actualizar entrega
  crearEntrega(entrega: Entrega): Observable<Entrega> {
    return this.http.post<Entrega>(`${this.apiUrl}/entregas-evaluacion/`, entrega);
  }

  // Obtener entregas por estudiante y evaluación
  getEntregaByEvaluacion(evaluacionId: number, estudianteId: number): Observable<Entrega> {
    return this.http.get<Entrega>(`${this.apiUrl}/entregas-evaluacion/?evaluacion_id=${evaluacionId}&estudiante_id=${estudianteId}`);
  }

  // Marcar como entregado (actualizar estado)
  marcarEntregado(id: number, videoUrl: string): Observable<Entrega> {
    return this.http.patch<Entrega>(`${this.apiUrl}/entregas-evaluacion/${id}/`, {
      estado: 'entregado',
      video_url: videoUrl,
      fecha_entrega: new Date().toISOString()
    });
  }
}