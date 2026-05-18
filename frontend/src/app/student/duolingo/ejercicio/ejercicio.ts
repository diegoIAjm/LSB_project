// src/app/student/duolingo/ejercicio/ejercicio.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DuolingoService, Ejercicio, EvaluarRespuesta } from '../../../services/duolingo';
import { AuthService } from '../../../services/auth';
import { CameraService } from '../../../services/camera.service';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

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
  resultado: EvaluarRespuesta | null = null;
  estudianteId: number | null = null;
  puntuacionTotal: number = 0;
  precisionTotal: number = 0;
  ejerciciosCompletados: number = 0;
  
  // Variables para grabación
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  grabando: boolean = false;
  tiempoGrabacion: number = 0;
  private timerInterval: any = null;
  cuentaRegresiva: number = 0;
  mostrandoCuentaRegresiva: boolean = false;
  private countdownInterval: any = null;
  
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
    // Esperar a que el canvas esté listo
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
    // Verificar que el canvas existe
    if (!this.canvasElement || !this.canvasElement.nativeElement) return;
    
    const canvasCtx = this.canvasElement.nativeElement.getContext('2d');
    if (!canvasCtx) return;
    
    // Asegurar que el canvas tiene el tamaño correcto
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
    
    // Esperar a que el DOM se actualice
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

  // Iniciar cuenta regresiva
  iniciarCuentaRegresiva(): void {
    this.mostrandoCuentaRegresiva = true;
    this.cuentaRegresiva = 3;
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

  // Iniciar grabación
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
    
    // Timer para mostrar tiempo
    this.timerInterval = setInterval(() => {
      this.tiempoGrabacion++;
      this.cdr.detectChanges();
    }, 1000);
    
    // Detener después de 3 segundos
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

  // Procesar video grabado
  procesarVideoGrabado(): void {
    if (this.recordedChunks.length === 0) {
      alert('No se grabó ningún video. Intenta nuevamente.');
      return;
    }
    
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const videoFile = new File([blob], `grabacion_${Date.now()}.webm`, { type: 'video/webm' });
    
    this.enviarAEvaluacion(videoFile);
  }

// En ejercicio.ts, modifica enviarAEvaluacion
enviarAEvaluacion(videoFile: File): void {
  this.evaluando = true;
  this.cdr.detectChanges();
  
  const senaId = this.ejercicioActual?.sena;
  if (!senaId) {
    console.error('El ejercicio no tiene una seña asociada');
    this.evaluando = false;
    return;
  }
  
  console.log('=== ENVIANDO A EVALUACIÓN ===');
  console.log('Seña ID:', senaId);
  console.log('Estudiante ID:', this.estudianteId);
  console.log('Video file:', videoFile.name, 'Tamaño:', videoFile.size, 'bytes');
  
  // Enviar también el estudiante_id
  this.duolingoService.evaluarSeñaConIA(senaId, videoFile, this.estudianteId!).subscribe({
    next: (respuesta) => {
      console.log('=== RESPUESTA IA ===');
      console.log('Precisión:', respuesta.precision);
      console.log('Color:', respuesta.color);
      console.log('Puntos ganados:', respuesta.puntos_ganados);
      console.log('Puntos totales:', respuesta.puntos_totales);
      console.log('Feedback:', respuesta.feedback);
      console.log('Seña detectada:', respuesta.sena_detectada);
      console.log('Detalles:', respuesta.detalles);
      console.log('===================');
      
      this.resultado = {
        precision: respuesta.precision,
        color: respuesta.color,
        puntos_ganados: respuesta.puntos_ganados,
        puntos_totales: respuesta.puntos_totales || 0,
        feedback: {
          mano: respuesta.detalles?.mano || 'medio',
          movimiento: respuesta.detalles?.movimiento || 'medio',
          posicion: 'medio'
        }
      };
      
      this.puntuacionTotal += respuesta.puntos_ganados;
      this.ejerciciosCompletados++;
      this.precisionTotal = (this.precisionTotal + respuesta.precision) / this.ejerciciosCompletados;
      this.evaluando = false;
      this.cerrarCamara();
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('=== ERROR EN EVALUACIÓN ===');
      console.error('Error:', err);
      console.error('Status:', err.status);
      console.error('Mensaje:', err.message);
      console.error('===========================');
      this.evaluando = false;
      this.cdr.detectChanges();
      alert('Error al evaluar la seña. Intenta nuevamente.');
    }
  });
}

  cargarEjercicios(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    
    this.duolingoService.getEjercicios(this.leccionId).subscribe({
      next: (ejercicios) => {
        console.log('Ejercicios recibidos:', ejercicios);
        this.ejercicios = ejercicios;
        if (this.ejercicios.length > 0) {
          this.ejercicioActual = this.ejercicios[0];
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
    this.resultado = null;
    this.indiceActual++;
    
    if (this.indiceActual < this.ejercicios.length) {
      this.ejercicioActual = this.ejercicios[this.indiceActual];
      this.cdr.detectChanges();
    } else {
      this.completarLeccion();
    }
  }

  completarLeccion(): void {
    this.duolingoService.completarLeccion(
      this.estudianteId!,
      this.leccionId,
      this.puntuacionTotal,
      this.precisionTotal
    ).subscribe({
      next: () => {
        this.router.navigate(['/student/duolingo/lecciones', this.leccionId], {
          state: { mensaje: '¡Lección completada!' }
        });
      },
      error: (err) => {
        console.error('Error al completar lección:', err);
        this.router.navigate(['/student/duolingo/lecciones', this.leccionId]);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/student/duolingo/lecciones', this.leccionId]);
  }

  getColorClass(color: string): string {
    switch(color) {
      case 'verde': return 'color-verde';
      case 'amarillo': return 'color-amarillo';
      case 'rojo': return 'color-rojo';
      default: return '';
    }
  }
}