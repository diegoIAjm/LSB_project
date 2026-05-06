// src/app/services/lecciones.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Leccion {
  id: number;
  unidad: number;
  titulo: string;
  orden: number;
  progreso?: {
    completado: boolean;
    puntuacion: number;
    precision: number;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class LeccionesService {
  // 🔹 CORREGIDO: Agregar 'duolingo/' a la URL
  private apiUrl = 'http://127.0.0.1:8000/api/duolingo';

  constructor(private http: HttpClient) {}

  getLecciones(): Observable<any> {
    // Ahora la URL será: http://127.0.0.1:8000/api/duolingo/lecciones/
    return this.http.get<any>(`${this.apiUrl}/lecciones/`);
  }

  getLeccionesByUnidad(unidadId: number): Observable<Leccion[]> {
    const params = new HttpParams().set('unidad_id', unidadId.toString());
    return this.http.get<Leccion[]>(`${this.apiUrl}/lecciones/`, { params });
  }
}