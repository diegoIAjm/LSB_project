// src/app/services/duolingo-ia.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DuolingoEvaluacionResponse {
  precision: number;
  nota: number;
  feedback: string;
  color: 'verde' | 'amarillo' | 'rojo';
  sena_detectada: string;
  puntos_ganados: number;
  detalles: {
    mano: string;
    movimiento: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DuolingoIAService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  evaluarSeña(senaId: number, videoFile: File, estudianteId?: number): Observable<DuolingoEvaluacionResponse> {
    const formData = new FormData();
    formData.append('sena_id', senaId.toString());
    formData.append('video', videoFile);
    if (estudianteId) {
      formData.append('estudiante_id', estudianteId.toString());
    }
    
    return this.http.post<DuolingoEvaluacionResponse>(`${this.apiUrl}/duolingo/evaluar-sena/`, formData);
  }
}