// src/app/student/mis-practicas/mis-practicas.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EvaluacionesService, Evaluacion } from '../../services/evaluaciones.service';
import { EntregasService, Entrega } from '../../services/entregas.service';

@Component({
  selector: 'app-mis-practicas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mis-practicas.html',
  styleUrls: ['./mis-practicas.css']
})
export class MisPracticasComponent implements OnInit {
  practicas: Evaluacion[] = [];
  practicasFiltradas: Evaluacion[] = [];
  cargando = false;
  filtroBusqueda = '';
  estudianteId = 1; // TODO: Obtener del auth service
  
  // Para la entrega
  mostrarModal = false;
  practicaSeleccionada: Evaluacion | null = null;
  videoUrl = '';
  entregando = false;

  constructor(
    private evaluacionService: EvaluacionesService,
    private entregasService: EntregasService
  ) {}

  ngOnInit(): void {
    this.cargarPracticas();
  }

  cargarPracticas(): void {
    this.cargando = true;
    // Obtener evaluaciones del curso del estudiante
    this.evaluacionService.getEvaluaciones().subscribe({
      next: (data: Evaluacion[]) => {
        this.practicas = data;
        this.practicasFiltradas = data;
        this.cargando = false;
        // Verificar estado de entrega para cada práctica
        this.verificarEntregas();
      },
      error: (error: any) => {
        console.error('Error cargando prácticas:', error);
        this.cargando = false;
        this.practicas = [];
        this.practicasFiltradas = [];
      }
    });
  }

  verificarEntregas(): void {
    // Por cada práctica, verificar si ya fue entregada
    this.practicas.forEach(practica => {
      this.entregasService.getEntregaByEvaluacion(practica.id!, this.estudianteId).subscribe({
        next: (entrega: Entrega) => {
          practica.estado_entrega = entrega.estado;
          practica.entrega_id = entrega.id;
        },
        error: () => {
          practica.estado_entrega = 'pendiente';
        }
      });
    });
  }

  filtrarPracticas(): void {
    if (this.filtroBusqueda) {
      this.practicasFiltradas = this.practicas.filter(practica =>
        practica.titulo.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
      );
    } else {
      this.practicasFiltradas = [...this.practicas];
    }
  }

  abrirModalEntrega(practica: Evaluacion): void {
    this.practicaSeleccionada = practica;
    this.videoUrl = '';
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.practicaSeleccionada = null;
    this.videoUrl = '';
  }

  entregarPractica(): void {
    if (!this.videoUrl) {
      alert('Por favor, ingresa la URL del video');
      return;
    }

    this.entregando = true;

    const entrega: Entrega = {
      evaluacion_id: this.practicaSeleccionada!.id!,
      estudiante_id: this.estudianteId,
      video_url: this.videoUrl,
      estado: 'entregado',
      fecha_entrega: new Date().toISOString()
    };

    this.entregasService.crearEntrega(entrega).subscribe({
      next: (response) => {
        console.log('Entrega realizada:', response);
        this.entregando = false;
        alert('✅ Práctica entregada exitosamente');
        this.cerrarModal();
        this.cargarPracticas(); // Recargar para actualizar estados
      },
      error: (error: any) => {
        console.error('Error al entregar:', error);
        this.entregando = false;
        alert('❌ Error al entregar la práctica');
      }
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch(estado) {
      case 'entregado': return 'estado-entregado';
      case 'revisado': return 'estado-revisado';
      default: return 'estado-pendiente';
    }
  }

  getEstadoTexto(estado: string): string {
    switch(estado) {
      case 'entregado': return 'Entregado';
      case 'revisado': return 'Revisado';
      default: return 'Pendiente';
    }
  }

  estaVencida(fechaLimite: string): boolean {
    return new Date(fechaLimite) < new Date();
  }
}