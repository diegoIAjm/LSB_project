// src/app/services/entregas.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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

  // 🔹 CORREGIDO: Devuelve un Observable que siempre emite un valor
  getEstadoEntrega(evaluacionId: number, estudianteId: number): Observable<Entrega | null> {
    return this.http.get<Entrega[]>(`${this.apiUrl}/entregas-evaluacion/?evaluacion_id=${evaluacionId}&estudiante_id=${estudianteId}`)
      .pipe(
        map(entregas => {
          if (entregas && entregas.length > 0) {
            return entregas[0]; // Devolver la primera entrega
          }
          return null; // No hay entrega
        })
      );
  }
}