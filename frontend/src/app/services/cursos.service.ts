import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Nivel {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Curso {
  id: number;
  nombre: string;
  nivel: number;           // ID del nivel (para enviar al backend)
  nivel_id: number;        // ID del nivel (respuesta)
  nivel_nombre: string;    // Nombre del nivel (respuesta)
  nivel_info?: Nivel;      // Info completa del nivel
  modalidad: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  docente: number | null;
  docente_nombre: string;
  duracion_meses: number;
  created_at?: string;
  updated_at?: string;
}

export interface Horario {
  id: number;
  curso: number;
  dia: string;
  dia_label: string;
  hora_inicio: string;
  hora_fin: string;
  aula: string | null;
  enlace_virtual: string | null;
}

export interface NuevoHorario {
  curso: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
  enlace_virtual?: string;
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
  private baseApi = 'http://127.0.0.1:8000/api/';

  constructor(private http: HttpClient) {}

  // ==================== NIVELES ====================
  // 🔹 NUEVO: Obtener todos los niveles disponibles
  getNiveles(): Observable<Nivel[]> {
    return this.http.get<Nivel[]>(`${this.baseApi}niveles/`);
  }

  // ==================== CURSOS ====================
  getCursos(filtros: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) params = params.set(key, filtros[key]);
    });
    return this.http.get<any>(this.api, { params });
  }

  crearCurso(curso: any): Observable<any> {
    return this.http.post(`${this.api}crear/`, curso);
  }

  getCurso(id: number): Observable<any> {
    return this.http.get(`${this.api}${id}/`);
  }

  editarCurso(id: number, curso: any): Observable<any> {
    return this.http.put(`${this.api}editar/${id}/`, curso);
  }

  toggleEstado(id: number): Observable<any> {
    return this.http.patch(`${this.api}${id}/toggle-estado/`, {});
  }

  eliminarCurso(id: number): Observable<any> {
    return this.http.delete(`${this.api}${id}/eliminar/`);
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

// Obtener docente por ID de usuario
getDocenteByUsuarioId(usuarioId: number): Observable<any> {
  // 🔹 CORREGIDO: quitar 'usuarios/' de la URL
  return this.http.get(`http://127.0.0.1:8000/api/docente/usuario/${usuarioId}/`);
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

// Obtener estudiantes inscritos en un curso
getEstudiantesByCurso(cursoId: number): Observable<any> {
  return this.http.get(`http://127.0.0.1:8000/api/cursos/${cursoId}/estudiantes/`);
}

// Cambiar estado de inscripción (activo/cancelado)
toggleInscripcionEstado(inscripcionId: number): Observable<any> {
  return this.http.patch(`http://127.0.0.1:8000/api/inscripciones/${inscripcionId}/toggle-estado/`, {});
}


getHorarios(cursoId: number): Observable<Horario[]> {
  let params = new HttpParams().set('curso_id', cursoId.toString());
  return this.http.get<Horario[]>(`${this.api}horarios/`, { params });
}

// Crear horario
crearHorario(horario: NuevoHorario): Observable<any> {
  return this.http.post(`${this.api}horarios/crear/`, horario);
}

// Actualizar horario
actualizarHorario(id: number, horario: NuevoHorario): Observable<any> {
  return this.http.put(`${this.api}horarios/editar/${id}/`, horario);
}

// Eliminar horario
eliminarHorario(id: number): Observable<any> {
  return this.http.delete(`${this.api}horarios/eliminar/${id}/`);
}

// Obtener lecciones de duolingo (sin relación con cursos, solo para mostrar)
getLeccionesDuolingo(): Observable<any[]> {
  return this.http.get<any[]>('http://127.0.0.1:8000/api/duolingo/lecciones/');
}

}