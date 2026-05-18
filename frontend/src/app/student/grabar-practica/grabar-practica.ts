// src/app/student/grabar-practica/grabar-practica.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EntregasService, EvaluacionIA } from '../../services/entregas.service';
import { EvaluacionesService, Evaluacion } from '../../services/evaluaciones.service';

@Component({
  selector: 'app-grabar-practica',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './grabar-practica.html',
  styleUrls: ['./grabar-practica.css']
})
export class GrabarPracticaComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  
  // Datos de la práctica
  evaluacionId: number = 0;
  practica: Evaluacion | null = null;
  estudianteId: number = 1;
  
  // Estados de grabación
  modo: 'grabar' | 'subir' | 'resultado' = 'grabar';
  grabando: boolean = false;
  videoGrabado: File | null = null;
  videoPreviewUrl: string | null = null;
  stream: MediaStream | null = null;
  chunks: Blob[] = [];
  tiempoGrabacion: number = 0;
  timerInterval: any;
  
  // Resultado de IA
  cargandoEvaluacion: boolean = false;
  resultado: EvaluacionIA | null = null;
  
  // Opciones
  camaras: MediaDeviceInfo[] = [];
  camaraSeleccionada: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entregasService: EntregasService,
    private evaluacionesService: EvaluacionesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.evaluacionId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarPractica();
    this.cargarCamaras();
  }

  ngOnDestroy(): void {
    this.detenerCamara();
  }

  cargarPractica(): void {
    this.evaluacionesService.getEvaluacion(this.evaluacionId).subscribe({
      next: (data) => {
        this.practica = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando práctica:', error);
        alert('No se pudo cargar la práctica');
        this.router.navigate(['/student/mis-practicas']);
      }
    });
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

  async reiniciarCamara(): Promise<void> {
    this.detenerCamara();
    if (this.camaraSeleccionada) {
      await this.iniciarGrabacion();
    }
  }

  async iniciarGrabacion(): Promise<void> {
    try {
      this.detenerCamara();
      
      const constraints: MediaStreamConstraints = {
        video: this.camaraSeleccionada ? { deviceId: { exact: this.camaraSeleccionada } } : true,
        audio: false
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Usamos optional chaining para evitar errores
      if (this.videoPlayer?.nativeElement) {
        this.videoPlayer.nativeElement.srcObject = this.stream;
        this.videoPlayer.nativeElement.muted = true;
        this.videoPlayer.nativeElement.play().catch(err => console.error('Error playing video:', err));
      }
      
      this.grabando = true;
      this.iniciarTimer();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }

  iniciarTimer(): void {
    this.tiempoGrabacion = 0;
    this.timerInterval = setInterval(() => {
      this.tiempoGrabacion++;
      this.cdr.detectChanges();
      
      if (this.tiempoGrabacion >= 30) {
        this.detenerGrabacion();
      }
    }, 1000);
  }

  detenerGrabacion(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
      this.stream = null;
    }
    
    this.grabando = false;
    this.capturarVideoGrabado();
  }

  capturarVideoGrabado(): void {
    // Verificamos que videoPlayer existe y tiene propiedades
    if (this.videoPlayer?.nativeElement && this.canvas?.nativeElement) {
      const videoElement = this.videoPlayer.nativeElement;
      const canvasElement = this.canvas.nativeElement;
      
      if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        const ctx = canvasElement.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0);
          
          canvasElement.toBlob((blob) => {
            if (blob) {
              this.videoGrabado = new File([blob], `grabacion_${Date.now()}.mp4`, { type: 'video/mp4' });
              this.videoPreviewUrl = URL.createObjectURL(this.videoGrabado);
              this.modo = 'subir';
              this.detenerCamara();
              this.cdr.detectChanges();
            }
          }, 'video/mp4');
        }
      } else {
        console.warn('Video dimensions not available');
        alert('No se pudo capturar el video. Intenta nuevamente.');
        this.modo = 'grabar';
        this.cdr.detectChanges();
      }
    } else {
      console.warn('Video player or canvas not available');
      alert('Error al capturar el video. Intenta nuevamente.');
      this.modo = 'grabar';
      this.cdr.detectChanges();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.videoGrabado = input.files[0];
      if (this.videoPreviewUrl) {
        URL.revokeObjectURL(this.videoPreviewUrl);
      }
      this.videoPreviewUrl = URL.createObjectURL(this.videoGrabado);
      this.modo = 'subir';
      this.detenerCamara();
      this.cdr.detectChanges();
    }
  }

  enviarEvaluacion(): void {
    if (!this.videoGrabado || !this.practica) {
      alert('Por favor, graba o selecciona un video primero.');
      return;
    }
    
    this.cargandoEvaluacion = true;
    this.cdr.detectChanges();
    
    const senaNombre = this.practica.titulo.split(' ')[0].toUpperCase();
    
    this.entregasService.entregarPracticaConVideo(
      this.evaluacionId,
      this.estudianteId,
      senaNombre,
      this.videoGrabado
    ).subscribe({
      next: (response) => {
        console.log('Respuesta:', response);
        this.resultado = response.resultado;
        this.modo = 'resultado';
        this.cargandoEvaluacion = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error:', error);
        this.cargandoEvaluacion = false;
        alert('Error al evaluar la práctica. Intenta nuevamente.');
        this.cdr.detectChanges();
      }
    });
  }

  reintentar(): void {
    this.modo = 'grabar';
    this.videoGrabado = null;
    if (this.videoPreviewUrl) {
      URL.revokeObjectURL(this.videoPreviewUrl);
      this.videoPreviewUrl = null;
    }
    this.resultado = null;
    this.cdr.detectChanges();
  }

  volver(): void {
    this.detenerCamara();
    this.router.navigate(['/student/mis-practicas']);
  }

  detenerCamara(): void {
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
      this.stream = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.grabando = false;
  }

  obtenerColorNota(): string {
    if (!this.resultado) return 'gray';
    return this.resultado.nota >= 3 ? '#4CAF50' : '#f44336';
  }
  obtenerNombreSena(): string {
    if (this.practica && this.practica.titulo) {
      return this.practica.titulo.split(' ')[0];
    }
    return 'la seña';
  }
}