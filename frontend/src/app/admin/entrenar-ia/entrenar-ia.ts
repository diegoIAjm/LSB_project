// src/app/admin/entrenar-ia/entrenar-ia.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

interface Sena {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_id: number | null;
  categoria_nombre: string | null;
  video_url: string | null;
  modelo_ruta: string | null;
}

@Component({
  selector: 'app-entrenar-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entrenar-ia.html',
  styleUrls: ['./entrenar-ia.css']
})
export class EntrenarIaComponent {
  senas: Sena[] = [];
  senaSeleccionada: Sena | null = null;
  videoFile: File | null = null;
  videoPreviewUrl: string | null = null;
  cargando = false;
  cargandoSenas = false;
  mostrarCardExito = false;
  senaEntrenadaNombre = '';
  mensaje: { texto: string; tipo: 'exito' | 'error' | 'info' } | null = null;
  
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    this.cargarSenas();
  }

  cargarSenas(): void {
    this.cargandoSenas = true;
    this.http.get<Sena[]>(`${this.apiUrl}/senas/senas/`).subscribe({
      next: (data) => {
        this.senas = data;
        this.cargandoSenas = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando señas:', error);
        this.mostrarMensaje('Error al cargar las señas', 'error');
        this.cargandoSenas = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarSena(sena: Sena): void {
    this.senaSeleccionada = sena;
    this.limpiarVideo();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.videoFile = input.files[0];
      if (this.videoPreviewUrl) {
        URL.revokeObjectURL(this.videoPreviewUrl);
      }
      this.videoPreviewUrl = URL.createObjectURL(this.videoFile);
    }
  }

  limpiarVideo(): void {
    this.videoFile = null;
    if (this.videoPreviewUrl) {
      URL.revokeObjectURL(this.videoPreviewUrl);
      this.videoPreviewUrl = null;
    }
  }

  entrenarModelo(): void {
    if (!this.senaSeleccionada) {
      this.mostrarMensaje('Selecciona una seña primero', 'error');
      return;
    }
    
    if (!this.videoFile) {
      this.mostrarMensaje('Selecciona un video de referencia', 'error');
      return;
    }
    
    this.cargando = true;
    this.mostrarCardExito = false;
    this.mostrarMensaje(`Entrenando modelo para la seña "${this.senaSeleccionada.nombre}"... Esto puede tomar varios minutos`, 'info');
    
    const formData = new FormData();
    formData.append('sena_id', this.senaSeleccionada.id.toString());
    formData.append('video', this.videoFile);
    
    this.http.post(`${this.apiUrl}/ia-admin/entrenar/`, formData).subscribe({
      next: (response: any) => {
        this.cargando = false;
        this.senaEntrenadaNombre = this.senaSeleccionada?.nombre || '';
        this.mostrarCardExito = true;
        this.mostrarMensaje(response.message || `✅ Modelo para "${this.senaSeleccionada?.nombre}" entrenado correctamente`, 'exito');
        this.limpiarVideo();
        
        // Recargar señas y actualizar la vista
        setTimeout(() => {
          this.cargarSenas(); // Recargar toda la lista
          this.senaSeleccionada = null;
          
          // Ocultar card de éxito después de 5 segundos
          setTimeout(() => {
            this.mostrarCardExito = false;
            this.mensaje = null;
            this.cdr.detectChanges();
          }, 5000);
        }, 1000);
      },
      error: (error) => {
        this.cargando = false;
        console.error('Error entrenando modelo:', error);
        if (error.status === 401 || error.status === 403) {
          this.mostrarMensaje('No tienes permisos de administrador para entrenar modelos', 'error');
        } else {
          this.mostrarMensaje(error.error?.error || 'Error al entrenar el modelo', 'error');
        }
      }
    });
  }

  cerrarCardExito(): void {
    this.mostrarCardExito = false;
    this.senaEntrenadaNombre = '';
  }

  mostrarMensaje(texto: string, tipo: 'exito' | 'error' | 'info'): void {
    this.mensaje = { texto, tipo };
    setTimeout(() => {
      if (this.mensaje?.texto === texto) {
        this.mensaje = null;
      }
    }, 5000);
  }
}