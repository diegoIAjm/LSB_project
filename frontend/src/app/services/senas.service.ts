// src/app/services/senas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface CategoriaSena {
  id: number;
  nombre: string;
}

export interface Sena {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_id: number;
  categoria_nombre?: string;
  video_url: string;
  modelo_ruta: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SenasService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getSenas(): Observable<Sena[]> {
    return this.http.get<Sena[]>(`${this.apiUrl}/senas/senas/`);
  }

  getCategorias(): Observable<CategoriaSena[]> {
    return this.http.get<CategoriaSena[]>(`${this.apiUrl}/senas/categorias/`);
  }

  getSenasPorCategoria(categoriaId: number): Observable<Sena[]> {
    return this.http.get<Sena[]>(`${this.apiUrl}/senas/senas/?categoria_id=${categoriaId}`);
  }
}