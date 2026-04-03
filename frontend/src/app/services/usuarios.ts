import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  ci: string;
  rol: string;       
  foto?: string;
  estado: string;
  fecha_registro: string;
}

export interface NuevoUsuario {
  nombre: string;
  apellido: string;
  email: string;
  ci: string;
  password: string;
  rol: number; // 🔹 usar número para el rol
}

export interface EditarUsuario {
  nombre: string;
  apellido: string;
  email: string;
  ci: string;
  rol: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private api = 'http://127.0.0.1:8000/api/usuarios/';

  constructor(private http: HttpClient) {}

  getUsuarios(filtros: any = {}): Observable<Usuario[]> {
    let params = new HttpParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) params = params.set(key, filtros[key]);
    });
    return this.http.get<Usuario[]>(this.api, { params });
  }

    crearUsuario(usuario: NuevoUsuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.api}crear/`, usuario);
  }

  toggleEstado(id: number) {
    return this.http.patch(`${this.api}${id}/estado/`, {});
  }

  editarUsuario(id: number, usuario: EditarUsuario): Observable<any> {
    return this.http.put(`${this.api}editar/${id}/`, usuario);
  }

  getUsuarioById(id: number): Observable<any> {
    return this.http.get<any>(this.api, { params: new HttpParams().set('pagina', '1').set('limite', '1000')});
  }
  getUsuario(id: number): Observable<any> {
  return this.http.get<any>(`${this.api}${id}/`);
}

}