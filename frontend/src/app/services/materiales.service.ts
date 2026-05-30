import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Material {
  id: number;
  titulo: string;
  tipo: string;
  archivo: string | null;
  archivo_url: string | null;
  curso: number;
  curso_nombre: string;
  leccion_id: number | null;
  fecha_formateada: string;
}

export interface MaterialesResponse {
  materiales: Material[];
  total: number;
}

export interface NuevoMaterial {
  titulo: string;
  tipo: string;
  curso: number;
  leccion_id?: number | null;
  archivo?: File | null;
  archivo_url?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialesService {
  private api = 'http://127.0.0.1:8000/api/materiales/';

  constructor(private http: HttpClient) {}

  getMateriales(cursoId: number): Observable<MaterialesResponse> {
    let params = new HttpParams().set('curso_id', cursoId.toString());
    return this.http.get<MaterialesResponse>(this.api, { params });
  }

  crearMaterial(formData: FormData): Observable<any> {
    return this.http.post(`${this.api}crear/`, formData);
  }

  actualizarMaterial(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.api}editar/${id}/`, formData);
  }

  eliminarMaterial(id: number): Observable<any> {
    return this.http.delete(`${this.api}eliminar/${id}/`);
  }
}