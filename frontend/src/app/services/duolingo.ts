import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Nivel {
  id: number;
  nombre: string;
}

export interface Unidad {
  id: number;
  nivel: number;
  nombre: string;
  orden: number;
}

export interface Leccion {
  id: number;
  unidad: number;
  titulo: string;
  orden: number;
  progreso?: {
    completado: boolean;
    puntuacion: number;
    precision: number | null;
  };
}

export interface Ejercicio {
  id: number;
  leccion: number;
  tipo: string;
  nivel: number;
  pregunta: string;
  sena: number | null;
  sena_info?: {
    id: number;
    nombre: string;
    descripcion: string;
    video_url: string | null;
    modelo_referencia: string | null;
  };
  es_examen: boolean;
  metadata: any;
}

export interface Progreso {
  id: number;
  leccion: number;
  leccion_titulo: string;
  completado: boolean;
  puntuacion: number;
  precision: number | null;
  intentos: number;
  fecha: string;
}

export interface Puntos {
  id: number;
  puntos_totales: number;
  racha_dias: number;
  ultima_actividad: string | null;
}

export interface EvaluarRespuesta {
  precision: number;
  color: string;
  puntos_ganados: number;
  puntos_totales: number;
  feedback: {
    mano: string;
    movimiento: string;
    posicion: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DuolingoService {
  private api = 'http://127.0.0.1:8000/api/duolingo/';

  constructor(private http: HttpClient) {}

  // Obtener todos los niveles
  getNiveles(): Observable<Nivel[]> {
    return this.http.get<Nivel[]>(`${this.api}niveles/`);
  }

  // Obtener unidades por nivel
  getUnidades(nivelId: number): Observable<Unidad[]> {
    let params = new HttpParams().set('nivel_id', nivelId.toString());
    return this.http.get<Unidad[]>(`${this.api}unidades/`, { params });
  }

  // Obtener lecciones por unidad
  getLecciones(unidadId: number, estudianteId?: number): Observable<Leccion[]> {
    let params = new HttpParams().set('unidad_id', unidadId.toString());
    if (estudianteId) {
      params = params.set('estudiante_id', estudianteId.toString());
    }
    return this.http.get<Leccion[]>(`${this.api}lecciones/`, { params });
  }

  // Obtener ejercicios por lección
  getEjercicios(leccionId: number): Observable<Ejercicio[]> {
    let params = new HttpParams().set('leccion_id', leccionId.toString());
    return this.http.get<Ejercicio[]>(`${this.api}ejercicios/`, { params });
  }

  // Obtener progreso del estudiante
  getProgreso(estudianteId: number): Observable<Progreso[]> {
    let params = new HttpParams().set('estudiante_id', estudianteId.toString());
    return this.http.get<Progreso[]>(`${this.api}progreso/`, { params });
  }

  // Obtener puntos del estudiante
  getPuntos(estudianteId: number): Observable<Puntos> {
    let params = new HttpParams().set('estudiante_id', estudianteId.toString());
    return this.http.get<Puntos>(`${this.api}puntos/`, { params });
  }

  // Evaluar ejercicio
  evaluarEjercicio(estudianteId: number, ejercicioId: number, keypoints: any): Observable<EvaluarRespuesta> {
    return this.http.post<EvaluarRespuesta>(`${this.api}evaluar-ejercicio/`, {
      estudiante_id: estudianteId,
      ejercicio_id: ejercicioId,
      keypoints: keypoints
    });
  }

  // Completar lección
  completarLeccion(estudianteId: number, leccionId: number, puntuacion: number, precision: number): Observable<any> {
    return this.http.post(`${this.api}completar-leccion/`, {
      estudiante_id: estudianteId,
      leccion_id: leccionId,
      puntuacion: puntuacion,
      precision: precision
    });
  }

}