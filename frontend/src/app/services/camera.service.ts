import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  
  public keypointsSubject = new Subject<any>();

  async initCamera(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<void> {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      throw err;
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  captureFrame(): void {
    if (!this.videoElement || !this.canvasElement) return;
    
    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return;
    
    this.canvasElement.width = this.videoElement.videoWidth;
    this.canvasElement.height = this.videoElement.videoHeight;
    ctx.drawImage(this.videoElement, 0, 0);
    
    // Emitir la imagen capturada
    this.canvasElement.toBlob((blob) => {
      if (blob) {
        this.keypointsSubject.next(blob);
      }
    }, 'image/jpeg');
  }
}