import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Curso {
  id: number;
  nombre: string;
  nivel: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  docente: number | null;
  docente_nombre: string;
  duracion_meses: number;
}

export interface Docente {
  id: number;
  nombre_completo: string;
  especialidad: string;
}

@Injectable({
  providedIn: 'root'
})
export class CursosService {
  private api = 'http://127.0.0.1:8000/api/cursos/';

  constructor(private http: HttpClient) {}

  // Obtener todos los cursos
  getCursos(filtros: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) params = params.set(key, filtros[key]);
    });
    return this.http.get<any>(this.api, { params });
  }

  // Crear curso
  crearCurso(curso: any): Observable<any> {
    return this.http.post(`${this.api}crear/`, curso);
  }

  // Obtener curso por ID
  getCurso(id: number): Observable<any> {
    return this.http.get(`${this.api}${id}/`);
  }

  // Editar curso
  editarCurso(id: number, curso: any): Observable<any> {
    return this.http.put(`${this.api}editar/${id}/`, curso);
  }

  // Cambiar estado (activar/desactivar)
  toggleEstado(id: number): Observable<any> {
    return this.http.patch(`${this.api}toggle-estado/${id}/`, {});
  }

  // Eliminar curso
  eliminarCurso(id: number): Observable<any> {
    return this.http.delete(`${this.api}eliminar/${id}/`);
  }

  // Obtener docentes disponibles
  getDocentesDisponibles(): Observable<Docente[]> {
    return this.http.get<Docente[]>(`http://127.0.0.1:8000/api/docentes/disponibles/`);
  }

  // Obtener estudiantes disponibles (no inscritos en un curso específico o todos)
getEstudiantesDisponibles(cursoId?: number): Observable<any> {
  let params = new HttpParams();
  if (cursoId) {
    params = params.set('curso_id', cursoId.toString());
  }
  return this.http.get('http://127.0.0.1:8000/api/estudiantes/disponibles/', { params });
}

// Obtener cursos disponibles para inscripción
getCursosDisponibles(): Observable<any> {
  return this.http.get('http://127.0.0.1:8000/api/cursos/disponibles/');
}

  getCursosActivos(): Observable<any> {
    return this.http.get('http://127.0.0.1:8000/api/cursos/activos/');
  }

// Inscribir estudiante
inscribirEstudiante(inscripcion: any): Observable<any> {
  return this.http.post('http://127.0.0.1:8000/api/inscripciones/', inscripcion);
}

getInscripciones(filtros: any = {}): Observable<any> {
  let params = new HttpParams();
  Object.keys(filtros).forEach(key => {
    if (filtros[key]) params = params.set(key, filtros[key]);
  });
  return this.http.get('http://127.0.0.1:8000/api/inscripciones/', { params });
}

  inscribirMasivo(data: any): Observable<any> {
    return this.http.post('http://127.0.0.1:8000/api/inscripciones/masivo/', data);
  }

// Cancelar inscripción
cancelarInscripcion(id: number): Observable<any> {
  return this.http.patch(`http://127.0.0.1:8000/api/inscripciones/${id}/cancelar/`, {});
}

toggleEstadoInscripcion(id: number): Observable<any> {
  return this.http.patch(`http://127.0.0.1:8000/api/inscripciones/${id}/toggle-estado/`, {});
}
}