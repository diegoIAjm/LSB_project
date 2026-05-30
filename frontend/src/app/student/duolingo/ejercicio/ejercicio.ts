// src/app/student/duolingo/ejercicio/ejercicio.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DuolingoService, Ejercicio, EvaluarRespuesta } from '../../../services/duolingo';
import { AuthService } from '../../../services/auth';
import { CameraService } from '../../../services/camera.service';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

interface EvaluacionGuardada {
  ejercicio_id: number;
  pregunta: string;
  sena_id?: number;
  precision: number;
  puntos_ganados: number;
  color: string;
  feedback: {
    mano: string;
    movimiento: string;
    posicion: string;
  };
  timestamp: Date;
}

@Component({
  selector: 'app-duolingo-ejercicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ejercicio.html',
  styleUrls: ['./ejercicio.css']
})
export class DuolingoEjercicioComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  
  leccionId: number = 0;
  ejercicios: Ejercicio[] = [];
  ejercicioActual: Ejercicio | null = null;
  indiceActual: number = 0;
  cargando = true;
  evaluando = false;
  camaraActiva = false;
  estudianteId: number | null = null;
  
  // Variables para el flujo acumulativo
  evaluacionesRealizadas: EvaluacionGuardada[] = [];
  mostrandoResumenFinal = false;
  promedioFinal = 0;
  puntuacionTotal = 0;
  ejerciciosCompletados = 0;
  
  // Variables para el flujo de grabación automática
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  grabando: boolean = false;
  tiempoGrabacion: number = 0;
  private timerInterval: any = null;
  cuentaRegresiva: number = 0;
  mostrandoCuentaRegresiva: boolean = false;
  mensajeInstruccion: string = '';
  private countdownInterval: any = null;
  private autoProximoEjercicio: boolean = true;
  
  // Modo repetir ejercicio específico
  modoRepetir: boolean = false;
  ejercicioRepetirId: number | null = null;
  
  private hands: Hands | null = null;
  private camera: any = null;
  private canvasReady: boolean = false;

  constructor(
    private duolingoService: DuolingoService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private cameraService: CameraService
  ) {}

  ngOnInit(): void {
    this.leccionId = Number(this.route.snapshot.paramMap.get('leccionId'));
    const user = this.authService.getCurrentUser();
    this.estudianteId = user?.id || null;
    this.cargarEjercicios();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.canvasReady = true;
      this.initMediaPipe();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.hands) {
      this.hands.close();
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.cameraService.stopCamera();
  }

  private initMediaPipe(): void {
    if (!this.canvasReady) return;
    
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    
    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    this.hands.onResults((results: Results) => {
      this.onHandsResults(results);
    });
  }

  private onHandsResults(results: Results): void {
    if (!this.canvasElement || !this.canvasElement.nativeElement) return;
    
    const canvasCtx = this.canvasElement.nativeElement.getContext('2d');
    if (!canvasCtx) return;
    
    if (this.canvasElement.nativeElement.width === 0) {
      this.canvasElement.nativeElement.width = this.videoElement?.nativeElement?.videoWidth || 640;
      this.canvasElement.nativeElement.height = this.videoElement?.nativeElement?.videoHeight || 480;
    }
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
    canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
    
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        for (const landmark of landmarks) {
          const x = landmark.x * this.canvasElement.nativeElement.width;
          const y = landmark.y * this.canvasElement.nativeElement.height;
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
          canvasCtx.fillStyle = '#58cc71';
          canvasCtx.fill();
        }
      }
    }
    canvasCtx.restore();
  }

  iniciarCamara(): void {
    this.camaraActiva = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      const video = this.videoElement?.nativeElement;
      if (!video) {
        console.error('Video element no encontrado');
        return;
      }
      
      this.camera = new Camera(video, {
        onFrame: async () => {
          if (this.hands) {
            await this.hands.send({ image: video });
          }
        },
        width: 640,
        height: 480
      });
      
      this.camera.start();
      
      // Iniciar automáticamente la cuenta regresiva al abrir la cámara
      setTimeout(() => {
        if (this.camaraActiva && !this.grabando && !this.evaluando) {
          this.iniciarCuentaRegresiva();
        }
      }, 500);
    }, 100);
  }

  cerrarCamara(): void {
    this.camaraActiva = false;
    this.grabando = false;
    this.mostrandoCuentaRegresiva = false;
    this.cuentaRegresiva = 0;
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    this.cdr.detectChanges();
  }

  // Cuenta regresiva de 5 segundos
  iniciarCuentaRegresiva(): void {
    this.mostrandoCuentaRegresiva = true;
    this.cuentaRegresiva = 5;
    this.mensajeInstruccion = `🎯 Realiza la seña: ${this.ejercicioActual?.pregunta || ''}`;
    this.cdr.detectChanges();
    
    this.countdownInterval = setInterval(() => {
      this.cuentaRegresiva--;
      this.cdr.detectChanges();
      
      if (this.cuentaRegresiva === 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.mostrandoCuentaRegresiva = false;
        this.iniciarGrabacion();
      }
    }, 1000);
  }

  iniciarGrabacion(): void {
    const video = this.videoElement?.nativeElement;
    if (!video || !video.srcObject) {
      alert('Error: No hay cámara disponible');
      return;
    }
    
    this.recordedChunks = [];
    this.grabando = true;
    this.tiempoGrabacion = 0;
    
    const stream = video.srcObject as MediaStream;
    this.mediaRecorder = new MediaRecorder(stream);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      this.procesarVideoGrabado();
    };
    
    this.mediaRecorder.start();
    
    this.timerInterval = setInterval(() => {
      this.tiempoGrabacion++;
      this.cdr.detectChanges();
    }, 1000);
    
    // Grabar por 3 segundos
    setTimeout(() => {
      if (this.grabando && this.mediaRecorder) {
        this.mediaRecorder.stop();
        this.grabando = false;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      }
    }, 3000);
    
    this.cdr.detectChanges();
  }

  procesarVideoGrabado(): void {
    if (this.recordedChunks.length === 0) {
      alert('No se grabó ningún video. Intenta nuevamente.');
      return;
    }
    
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const videoFile = new File([blob], `grabacion_${Date.now()}.webm`, { type: 'video/webm' });
    
    this.enviarAEvaluacion(videoFile);
  }

// En enviarAEvaluacion, modifica la creación de evaluacionRespuesta
enviarAEvaluacion(videoFile: File): void {
  this.evaluando = true;
  this.cdr.detectChanges();
  
  const senaId = this.ejercicioActual?.sena;
  if (!senaId) {
    console.error('El ejercicio no tiene una seña asociada');
    this.evaluando = false;
    return;
  }
  
  this.duolingoService.evaluarSeñaConIA(senaId, videoFile, this.estudianteId!).subscribe({
    next: (respuesta) => {
      // Crear evaluacionRespuesta con posicion requerida
      const evaluacionRespuesta: EvaluarRespuesta = {
        precision: respuesta.precision,
        color: respuesta.color,
        puntos_ganados: respuesta.puntos_ganados,
        puntos_totales: respuesta.puntos_totales || 0,
        feedback: {
          mano: respuesta.detalles?.mano || 'medio',
          movimiento: respuesta.detalles?.movimiento || 'medio',
          posicion: 'medio'  // Valor fijo ya que no viene del backend
        }
      };
      
      this.guardarEvaluacion(evaluacionRespuesta);
      
      this.evaluando = false;
      this.cerrarCamara();
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error en evaluación:', err);
      this.evaluando = false;
      this.cdr.detectChanges();
      alert('Error al evaluar la seña. Intenta nuevamente.');
    }
  });
}

// En guardarEvaluacion, también agrega posicion con valor fijo
guardarEvaluacion(respuesta: EvaluarRespuesta): void {
  // Si es modo repetir, actualizar la evaluación existente
  if (this.modoRepetir && this.ejercicioRepetirId) {
    const index = this.evaluacionesRealizadas.findIndex(e => e.ejercicio_id === this.ejercicioRepetirId);
    if (index !== -1) {
      // Restar los puntos anteriores
      this.puntuacionTotal -= this.evaluacionesRealizadas[index].puntos_ganados;
      // Actualizar evaluación
      this.evaluacionesRealizadas[index] = {
        ejercicio_id: this.ejercicioActual?.id || 0,
        pregunta: this.ejercicioActual?.pregunta || '',
        sena_id: this.ejercicioActual?.sena || undefined,
        precision: respuesta.precision,
        puntos_ganados: respuesta.puntos_ganados,
        color: respuesta.color,
        feedback: {
          mano: respuesta.feedback?.mano || 'medio',
          movimiento: respuesta.feedback?.movimiento || 'medio',
          posicion: respuesta.feedback?.posicion || 'medio'
        },
        timestamp: new Date()
      };
      this.puntuacionTotal += respuesta.puntos_ganados;
    }
    
    // Salir del modo repetir
    this.modoRepetir = false;
    this.ejercicioRepetirId = null;
    
    // Mostrar resumen actualizado
    this.mostrarResumenFinal();
    return;
  }
  
  // Modo normal
  const evaluacion: EvaluacionGuardada = {
    ejercicio_id: this.ejercicioActual?.id || 0,
    pregunta: this.ejercicioActual?.pregunta || '',
    sena_id: this.ejercicioActual?.sena || undefined,
    precision: respuesta.precision,
    puntos_ganados: respuesta.puntos_ganados,
    color: respuesta.color,
    feedback: {
      mano: respuesta.feedback?.mano || 'medio',
      movimiento: respuesta.feedback?.movimiento || 'medio',
      posicion: respuesta.feedback?.posicion || 'medio'
    },
    timestamp: new Date()
  };
  
  this.evaluacionesRealizadas.push(evaluacion);
  this.puntuacionTotal += respuesta.puntos_ganados;
  this.ejerciciosCompletados++;
  
  // Verificar si hay más ejercicios
  if (this.indiceActual + 1 < this.ejercicios.length) {
    this.siguienteEjercicio();
  } else {
    this.mostrarResumenFinal();
  }
}

  mostrarResumenFinal(): void {
    let totalPrecision = 0;
    for (let i = 0; i < this.evaluacionesRealizadas.length; i++) {
      totalPrecision += this.evaluacionesRealizadas[i].precision;
    }
    this.promedioFinal = totalPrecision / this.evaluacionesRealizadas.length;
    
    this.mostrandoResumenFinal = true;
    this.camaraActiva = false;
    this.cdr.detectChanges();
    
    this.guardarEstadisticasFinales();
  }

  guardarEstadisticasFinales(): void {
    this.duolingoService.completarLeccion(
      this.estudianteId!,
      this.leccionId,
      this.puntuacionTotal,
      this.promedioFinal
    ).subscribe({
      next: () => {
        console.log('Estadísticas guardadas correctamente');
      },
      error: (err) => {
        console.error('Error guardando estadísticas:', err);
      }
    });
  }

  cargarEjercicios(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    
    this.duolingoService.getEjercicios(this.leccionId).subscribe({
      next: (ejercicios) => {
        this.ejercicios = ejercicios;
        if (this.ejercicios.length > 0) {
          this.ejercicioActual = this.ejercicios[0];
          this.indiceActual = 0;
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ejercicios:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  siguienteEjercicio(): void {
    this.indiceActual++;
    
    if (this.indiceActual < this.ejercicios.length) {
      this.ejercicioActual = this.ejercicios[this.indiceActual];
      this.cdr.detectChanges();
      // Iniciar automáticamente la cámara para el siguiente ejercicio
      setTimeout(() => {
        this.iniciarCamara();
      }, 1000);
    }
  }

  // Repetir ejercicio específico
  repetirEjercicioEspecifico(ejercicioId: number): void {
    const ejercicio = this.ejercicios.find(e => e.id === ejercicioId);
    if (ejercicio) {
      this.modoRepetir = true;
      this.ejercicioRepetirId = ejercicioId;
      this.ejercicioActual = ejercicio;
      this.indiceActual = this.ejercicios.findIndex(e => e.id === ejercicioId);
      this.mostrandoResumenFinal = false;
      this.cdr.detectChanges();
      
      // Iniciar cámara para repetir el ejercicio
      setTimeout(() => {
        this.iniciarCamara();
      }, 500);
    }
  }

  repetirLeccionCompleta(): void {
    this.evaluacionesRealizadas = [];
    this.puntuacionTotal = 0;
    this.ejerciciosCompletados = 0;
    this.promedioFinal = 0;
    this.indiceActual = 0;
    this.mostrandoResumenFinal = false;
    this.modoRepetir = false;
    this.ejercicioRepetirId = null;
    
    if (this.ejercicios.length > 0) {
      this.ejercicioActual = this.ejercicios[0];
    }
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.iniciarCamara();
    }, 500);
  }

  cerrarResumen(): void {
    this.mostrandoResumenFinal = false;
    this.volver();
  }

  irSiguienteLeccion(): void {
    this.router.navigate(['/student/duolingo/lecciones', this.leccionId + 1]);
  }

  getColorClase(precision: number): string {
    if (precision >= 70) return 'verde';
    if (precision >= 40) return 'amarillo';
    return 'rojo';
  }

  getPrecisionIcon(precision: number): string {
    if (precision >= 70) return '🎉';
    if (precision >= 40) return '👍';
    return '💪';
  }

  volver(): void {
    this.router.navigate(['/student/duolingo/lecciones', this.leccionId]);
  }
}