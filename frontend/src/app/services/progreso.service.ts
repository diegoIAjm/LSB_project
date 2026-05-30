// src/app/services/progreso.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EstadisticasGlobales {
  total_puntos: number;
  promedio_precision: number;
  total_ejercicios: number;
  ejercicios_aprobados: number;
  ejercicios_completados: number;
  racha_dias: number;
  nivel_actual: string;
  /** Fecha o cadena ISO de la última actualización de las estadísticas */
  ultima_actualizacion?: string | Date;
  lecciones_completadas: number;
  total_lecciones: number;
  porcentaje_completado: number;
  // 👇 Agrega estas 3 propiedades
  mejora_total: number;
  mejor_sesion: number;
  total_sesiones: number;
}

export interface ProgresoLeccion {
  leccion_id: number;
  leccion_titulo: string;
  completado: boolean;
  puntuacion: number;
  precision: number;
  intentos: number;
  fecha: string;
}

export interface EvolucionPrecision {
  fecha: string;
  precision: number;
  ejercicio_nombre: string;
  color?: string;
}

export interface RankingEstudiante {
  id: number;
  nombre: string;
  apellido: string;
  puntos_totales: number;
  promedio_precision: number;
  ejercicios_completados: number;
  avatar?: string;
  esUsuarioActual?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProgresoService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getEstadisticas(estudianteId: number): Observable<EstadisticasGlobales> {
    return this.http.get<EstadisticasGlobales>(`${this.apiUrl}/progreso/estadisticas/?estudiante_id=${estudianteId}`);
  }

  getProgresoLecciones(estudianteId: number): Observable<ProgresoLeccion[]> {
    return this.http.get<ProgresoLeccion[]>(`${this.apiUrl}/progreso/lecciones/?estudiante_id=${estudianteId}`);
  }

  getEvolucionPrecision(estudianteId: number): Observable<EvolucionPrecision[]> {
    return this.http.get<EvolucionPrecision[]>(`${this.apiUrl}/progreso/evolucion/?estudiante_id=${estudianteId}`);
  }

  getRankingGeneral(limit: number = 10): Observable<RankingEstudiante[]> {
    return this.http.get<RankingEstudiante[]>(`${this.apiUrl}/progreso/ranking/?limit=${limit}`);
  }

  getRankingLeccion(leccionId: number): Observable<RankingEstudiante[]> {
    return this.http.get<RankingEstudiante[]>(`${this.apiUrl}/progreso/ranking-leccion/${leccionId}/`);
  }
}