import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DuolingoService, Ejercicio, EvaluarRespuesta } from '../../../services/duolingo';
import { AuthService } from '../../../services/auth';
import { CameraService } from '../../../services/camera.service';
import { Hands, Results, VERSION } from '@mediapipe/hands';
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
  
  private hands: Hands | null = null;
  private camera: any = null;

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
    this.initMediaPipe();
  }

  ngOnDestroy(): void {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.hands) {
      this.hands.close();
    }
    this.cameraService.stopCamera();
  }

  private initMediaPipe(): void {
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
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
    // Dibujar los puntos en el canvas
    const canvasCtx = this.canvasElement.nativeElement.getContext('2d');
    if (!canvasCtx) return;
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
    canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
    
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        // Dibujar puntos
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
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    
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
  }

  capturarYEvaluar(): void {
    if (!this.ejercicioActual) return;
    
    this.evaluando = true;
    this.cdr.detectChanges();
    
    // Capturar keypoints actuales (simplificado, usar resultados de MediaPipe)
    const keypointsCapturados = { frames: [] };
    
    this.duolingoService.evaluarEjercicio(
      this.estudianteId!,
      this.ejercicioActual.id,
      keypointsCapturados
    ).subscribe({
      next: (respuesta) => {
        this.resultado = respuesta;
        this.puntuacionTotal += respuesta.puntos_ganados;
        this.ejerciciosCompletados++;
        this.precisionTotal = (this.precisionTotal + respuesta.precision) / this.ejerciciosCompletados;
        this.evaluando = false;
        this.camaraActiva = false;
        if (this.camera) {
          this.camera.stop();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al evaluar:', err);
        this.evaluando = false;
        this.cdr.detectChanges();
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

  simularEvaluacion(): void {
    if (!this.ejercicioActual) return;
    
    this.evaluando = true;
    this.cdr.detectChanges();
    
    const keypointsSimulados = { frames: [] };
    
    this.duolingoService.evaluarEjercicio(
      this.estudianteId!, 
      this.ejercicioActual.id, 
      keypointsSimulados
    ).subscribe({
      next: (respuesta) => {
        console.log('Respuesta evaluación:', respuesta);
        this.resultado = respuesta;
        this.puntuacionTotal += respuesta.puntos_ganados;
        this.ejerciciosCompletados++;
        this.precisionTotal = (this.precisionTotal + respuesta.precision) / this.ejerciciosCompletados;
        this.evaluando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al evaluar:', err);
        this.evaluando = false;
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

  cerrarCamara(): void {
  this.camaraActiva = false;
  if (this.camera) {
    this.camera.stop();
    this.camera = null;
  }
}
}