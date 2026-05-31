// src/app/student/grabar-practica/grabar-practica.ts

import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EntregasService } from '../../services/entregas.service';
import { EvaluacionesService, Evaluacion } from '../../services/evaluaciones.service';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { AuthService } from '../../services/auth';

interface SenaPendiente {
  id: number;
  nombre: string;
  orden: number;
  evaluacion_sena_id: number;
}

interface ResultadoSena {
  precision: number;
  puntuacion: number;
  color: string;
  sena_detectada: string;
  feedback: {
    mano: string;
    movimiento: string;
  };
}

@Component({
  selector: 'app-grabar-practica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grabar-practica.html',
  styleUrls: ['./grabar-practica.css']
})
export class GrabarPracticaComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  // Datos de la práctica
  evaluacionId: number = 0;
  practica: Evaluacion | null = null;
  estudianteId: number = 0;  // ✅ Cambiado de null a 0
  entregaId: number = 0;

  // Señas pendientes
  senasPendientes: SenaPendiente[] = [];
  senaActual: SenaPendiente | null = null;
  indiceActual: number = 0;
  totalSenas: number = 0;
  senasCompletadas: number = 0;
  hayMasSenas: boolean = true;

  // Estados de grabación
  grabando: boolean = false;
  evaluando: boolean = false;
  mostrandoCuentaRegresiva: boolean = false;
  cuentaRegresiva: number = 3;
  duracionGrabacion: number = 4;
  tiempoGrabacion: number = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private countdownInterval: any = null;
  private timerInterval: any = null;

  // Resultado actual
  resultadoActual: ResultadoSena | null = null;

  // MediaPipe
  private hands: Hands | null = null;
  private camera: any = null;
  private canvasReady: boolean = false;

  // Cámaras
  camaras: MediaDeviceInfo[] = [];
  camaraSeleccionada: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entregasService: EntregasService,
    private evaluacionesService: EvaluacionesService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

ngOnInit(): void {
    this.evaluacionId = Number(this.route.snapshot.paramMap.get('id'));
    
    // ✅ Obtener el estudiante_id real
    this.authService.getEstudianteId().subscribe({
        next: (estudianteIdReal) => {
            if (estudianteIdReal) {
                this.estudianteId = estudianteIdReal;
                console.log('Estudiante ID real en grabar:', this.estudianteId);
                this.cargarDatos();
                this.cargarCamaras();
            } else {
                // Fallback
                const user = this.authService.getCurrentUser();
                this.estudianteId = user?.id || 0;
                this.cargarDatos();
                this.cargarCamaras();
            }
        }
    });
}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.canvasReady = true;
      this.initMediaPipe();
    }, 500);
  }

ngOnDestroy(): void {
    this.detenerTodo();
    try {
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
        if (this.hands) {
            // Intentar cerrar correctamente
            this.hands.close();
            this.hands = null;
        }
    } catch (error) {
        console.warn('Error al cerrar MediaPipe:', error);
    }
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
      this.dibujarLandmarks(results);
    });
  }

  private dibujarLandmarks(results: Results): void {
    if (!this.canvasElement || !this.canvasElement.nativeElement) return;

    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width === 0 && this.videoElement?.nativeElement) {
      canvas.width = this.videoElement.nativeElement.videoWidth || 640;
      canvas.height = this.videoElement.nativeElement.videoHeight || 480;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        for (const landmark of landmarks) {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#58cc71';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        const conexiones = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [0, 9], [9, 10], [10, 11], [11, 12],
          [0, 13], [13, 14], [14, 15], [15, 16],
          [0, 17], [17, 18], [18, 19], [19, 20],
          [5, 9], [9, 13], [13, 17]
        ];

        ctx.beginPath();
        ctx.strokeStyle = '#58cc71';
        ctx.lineWidth = 2;
        for (const [start, end] of conexiones) {
          const startPoint = landmarks[start];
          const endPoint = landmarks[end];
          if (startPoint && endPoint) {
            ctx.beginPath();
            ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
            ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
            ctx.stroke();
          }
        }
      }
    }
    ctx.restore();
  }

  async cargarCamaras(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.camaras = devices.filter(device => device.kind === 'videoinput');
      if (this.camaras.length > 0) {
        this.camaraSeleccionada = this.camaras[0].deviceId;
      }
    } catch (error) {
      console.error('Error cargando cámaras:', error);
    }
  }

  async cambiarCamara(): Promise<void> {
    await this.iniciarCamara();
  }

  async iniciarCamara(): Promise<void> {
    if (this.camera) {
      this.camera.stop();
    }

    const video = this.videoElement?.nativeElement;
    if (!video) return;

    this.camera = new Camera(video, {
      onFrame: async () => {
        if (this.hands && video) {
          await this.hands.send({ image: video });
        }
      },
      width: 640,
      height: 480
    });

    this.camera.start();
  }

cargarDatos(): void {
    console.log('=== CARGAR DATOS ===');
    console.log('evaluacionId:', this.evaluacionId);
    console.log('estudianteId:', this.estudianteId);
    
    this.entregasService.iniciarEntrega(this.evaluacionId, this.estudianteId).subscribe({
        next: (response) => {
            console.log('✅ Respuesta de iniciarEntrega:', response);
            
            this.entregaId = response.entrega_id;
            this.senasPendientes = response.senas_pendientes || [];
            this.totalSenas = response.total_senas || 0;
            
            if (this.senasPendientes.length > 0) {
                console.log('✅ Hay señas pendientes, iniciando cámara');
                this.senaActual = this.senasPendientes[0];
                this.indiceActual = 0;
                this.hayMasSenas = this.senasPendientes.length > 1;
                this.senasCompletadas = 0;
                this.iniciarCamara();
            } else {
                console.error('❌ No hay señas pendientes');
                alert('Error: No hay señas para grabar en esta práctica');
                this.volver();
            }
            this.cdr.detectChanges();
        },
        error: (error) => {
            console.error('❌ Error cargando datos:', error);
            alert('Error al cargar la práctica: ' + (error.error?.error || 'Intenta nuevamente'));
            this.volver();
        }
    });
}

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

      if (this.tiempoGrabacion >= this.duracionGrabacion) {
        this.detenerGrabacion();
      }
    }, 1000);

    this.cdr.detectChanges();
  }

  detenerGrabacion(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.mediaRecorder && this.grabando) {
      this.mediaRecorder.stop();
      this.grabando = false;
    }
  }

  procesarVideoGrabado(): void {
    if (this.recordedChunks.length === 0) {
      alert('No se grabó ningún video. Intenta nuevamente.');
      return;
    }

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const videoFile = new File([blob], `grabacion_sena_${this.senaActual?.id}.webm`, { type: 'video/webm' });

    this.enviarEvaluacion(videoFile);
  }

enviarEvaluacion(videoFile: File): void {
    this.evaluando = true;
    this.cdr.detectChanges();
    
    console.log('=== ENVIAR EVALUACION ===');
    console.log('evaluacionId:', this.evaluacionId);
    console.log('estudianteId:', this.estudianteId);
    console.log('senaId:', this.senaActual?.id);
    
    this.entregasService.entregarVideo(
        this.evaluacionId,
        this.estudianteId,
        this.senaActual!.id,
        videoFile
    ).subscribe({
        next: (response) => {
            console.log('✅ Evaluación exitosa:', response);
            this.resultadoActual = response.resultado;
            this.evaluando = false;
            this.cdr.detectChanges();
        },
        error: (error) => {
            console.error('❌ Error en evaluación:', error);
            console.error('Status:', error.status);
            console.error('Error detail:', error.error);
            this.evaluando = false;
            alert('Error al evaluar la seña. Intenta nuevamente.');
            this.cdr.detectChanges();
        }
    });
}

  siguienteSena(): void {
    this.resultadoActual = null;
    
    this.senasCompletadas++;
    
    if (this.indiceActual + 1 < this.senasPendientes.length) {
      this.indiceActual++;
      this.senaActual = this.senasPendientes[this.indiceActual];
      this.hayMasSenas = this.indiceActual + 1 < this.senasPendientes.length;
      this.cdr.detectChanges();
    } else {
      this.finalizarPractica();
    }
  }

  finalizarPractica(): void {
    this.entregasService.completarEntrega(this.entregaId).subscribe({
      next: () => {
        this.router.navigate(['/student/mis-practicas']);
      },
      error: (error) => {
        console.error('Error finalizando:', error);
        this.router.navigate(['/student/mis-practicas']);
      }
    });
  }

  volver(): void {
    this.detenerTodo();
    this.router.navigate(['/student/mis-practicas']);
  }

private detenerTodo(): void {
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }
    if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
    }
    if (this.mediaRecorder && this.grabando) {
        try {
            this.mediaRecorder.stop();
        } catch (e) {}
        this.mediaRecorder = null;
        this.grabando = false;
    }
}
}