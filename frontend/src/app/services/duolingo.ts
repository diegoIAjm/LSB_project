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
  progreso?: number;           
  desbloqueada?: boolean;      
  lecciones_completadas?: number;  
  total_lecciones?: number;  
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
  desbloqueada?: boolean;  // ← Agregado
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

export interface EvaluacionIAResponse {
  precision: number;
  nota: number;
  feedback: string;
  color: 'verde' | 'amarillo' | 'rojo';
  sena_detectada: string;
  puntos_ganados: number;
  puntos_totales: number;
  detalles: {
    mano: string;
    movimiento: string;
  };
}

// ========== NUEVAS INTERFACES PARA LOGROS ==========
export interface Logro {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
  desbloqueado: boolean;
  puntos_recompensa: number;
  fecha_desbloqueo?: Date;
}

export interface RespuestaCompletarLeccion {
  success: boolean;
  puntos_totales: number;
  racha_dias: number;
  logros_desbloqueados: Logro[];
  siguiente_leccion?: { id: number; titulo: string };
  siguiente_unidad?: { id: number; nombre: string };
  siguiente_nivel?: { id: number; nombre: string };
}

@Injectable({
  providedIn: 'root'
})
export class DuolingoService {
  private api = 'http://127.0.0.1:8000/api/duolingo/';

  constructor(private http: HttpClient) {}

  // Obtener todos los niveles
  getNiveles(estudianteId?: number): Observable<Nivel[]> {
    let params = new HttpParams();
    if (estudianteId) {
      params = params.set('estudiante_id', estudianteId.toString());
    }
    return this.http.get<Nivel[]>(`${this.api}niveles/`, { params });
  }

  // Obtener unidades por nivel (CON estudianteId para progreso)
  getUnidades(nivelId: number, estudianteId?: number): Observable<Unidad[]> {
    let params = new HttpParams().set('nivel_id', nivelId.toString());
    if (estudianteId) {
      params = params.set('estudiante_id', estudianteId.toString());
    }
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

  // Evaluar ejercicio (simulación)
  evaluarEjercicio(estudianteId: number, ejercicioId: number, keypoints: any): Observable<EvaluarRespuesta> {
    return this.http.post<EvaluarRespuesta>(`${this.api}evaluar-ejercicio/`, {
      estudiante_id: estudianteId,
      ejercicio_id: ejercicioId,
      keypoints: keypoints
    });
  }

  // Evaluar seña con IA usando el modelo entrenado
  evaluarSeñaConIA(senaId: number, videoFile: File, estudianteId: number): Observable<EvaluacionIAResponse> {
    const formData = new FormData();
    formData.append('sena_id', senaId.toString());
    formData.append('video', videoFile);
    formData.append('estudiante_id', estudianteId.toString());
    
    return this.http.post<EvaluacionIAResponse>(`${this.api}evaluar-sena-ia/`, formData);
  }

  // Completar lección (versión simple)
  completarLeccion(estudianteId: number, leccionId: number, puntuacion: number, precision: number): Observable<any> {
    return this.http.post(`${this.api}completar-leccion/`, {
      estudiante_id: estudianteId,
      leccion_id: leccionId,
      puntuacion: puntuacion,
      precision: precision
    });
  }

  // ========== NUEVOS MÉTODOS PARA LOGROS Y DESBLOQUEO ==========

  // Completar lección con verificación de logros
  completarLeccionConLogros(estudianteId: number, leccionId: number, puntuacion: number, precision: number): Observable<RespuestaCompletarLeccion> {
    return this.http.post<RespuestaCompletarLeccion>(`${this.api}completar-leccion-logros/`, {
      estudiante_id: estudianteId,
      leccion_id: leccionId,
      puntuacion: puntuacion,
      precision: precision
    });
  }

  // Obtener todos los logros del usuario con estado
  getLogrosUsuario(estudianteId: number): Observable<Logro[]> {
    return this.http.get<Logro[]>(`${this.api}logros/${estudianteId}/`);
  }

  // Verificar si una lección está desbloqueada
  verificarDesbloqueoLeccion(leccionId: number, estudianteId: number): Observable<{ desbloqueada: boolean }> {
    let params = new HttpParams().set('estudiante_id', estudianteId.toString());
    return this.http.get<{ desbloqueada: boolean }>(`${this.api}leccion/${leccionId}/desbloqueada/`, { params });
  }

  // Obtener siguiente contenido desbloqueado
  getSiguienteContenido(estudianteId: number): Observable<{
    siguiente_leccion: { id: number; titulo: string; unidad_id: number; unidad_nombre: string } | null;
    siguiente_unidad: { id: number; nombre: string; nivel_id: number } | null;
    siguiente_nivel: { id: number; nombre: string } | null;
  }> {
    let params = new HttpParams().set('estudiante_id', estudianteId.toString());
    return this.http.get<any>(`${this.api}siguiente-contenido/`, { params });
  }
}