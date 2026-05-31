// src/app/student/mis-practicas/mis-practicas.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { EvaluacionesService, Evaluacion } from '../../services/evaluaciones.service';
import { EntregasService, Entrega } from '../../services/entregas.service';
import { AuthService } from '../../services/auth';

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
  filtroEstado: string = 'todos';
  estudianteId: number | null = null;
  verificando = false;
  reintentando: { [key: number]: boolean } = {};

  constructor(
    private evaluacionService: EvaluacionesService,
    private entregasService: EntregasService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

ngOnInit(): void {
    // ✅ Obtener el estudiante_id real (no el usuario_id)
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
        // Llamar al endpoint para obtener el estudiante_id real
        this.authService.getEstudianteId().subscribe({
            next: (estudianteIdReal) => {
                this.estudianteId = estudianteIdReal;  // Esto debería ser 8, no 25
                console.log('Estudiante ID real:', this.estudianteId);
                this.cargarPracticas();
            },
            error: () => {
                // Fallback: usar el usuario_id
                this.estudianteId = user.id;
                this.cargarPracticas();
            }
        });
    } else {
        this.cargando = false;
    }
}

  cargarPracticas(): void {
    this.cargando = true;
    this.evaluacionService.getEvaluaciones({ estado: 'activo' }).subscribe({
      next: (data: Evaluacion[]) => {
        this.practicas = data;
        this.practicasFiltradas = [...data];
        this.verificarEstados();
      },
      error: (error: any) => {
        console.error('Error cargando prácticas:', error);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  verificarEstados(): void {
    this.verificando = true;
    let completadas = 0;

    this.practicas.forEach(practica => {
      if (!this.estudianteId) {
        completadas++;
        if (completadas === this.practicas.length) {
          this.verificando = false;
          this.cargando = false;
          this.cdr.detectChanges();
        }
        return;
      }

      this.entregasService.getEstadoEntrega(practica.id!, this.estudianteId).subscribe({
        next: (entrega: Entrega | null) => {
        console.log('=== DATOS DE ENTREGA ===');
        console.log('Entrega completa:', entrega);
        console.log('Intentos:', entrega?.intentos);
        console.log('Estado:', entrega?.estado);
          if (entrega) {
            practica.estado_entrega = entrega.estado;
            practica.entrega_id = entrega.id;
            practica.nota_final = entrega.nota_final;
            practica.nota = entrega.nota_final;
            practica.intentos_realizados = entrega.intentos || 0;
            
            if (entrega.id && (entrega.estado === 'completado' || entrega.estado === 'revisado')) {
              this.entregasService.getResultadoEntregaDetallado(entrega.id).subscribe({
                next: (resultado: any) => {
                  practica.precision = resultado.precision_promedio;
                  practica.videos_aprobados = resultado.videos_aprobados;
                  practica.videos_total = resultado.videos_total;
                  practica.resultado_detallado = resultado;
                  this.cdr.detectChanges();
                },
                error: (err: any) => console.error('Error cargando detalle:', err)
              });
            }
          } else {
            practica.estado_entrega = 'pendiente';
            practica.intentos_realizados = 0;
          }
          
          completadas++;
          if (completadas === this.practicas.length) {
            this.verificando = false;
            this.cargando = false;
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          console.error(`Error:`, error);
          practica.estado_entrega = 'pendiente';
          practica.intentos_realizados = 0;
          completadas++;
          if (completadas === this.practicas.length) {
            this.verificando = false;
            this.cargando = false;
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  getEstadoBadgeClass(estado: string = 'pendiente'): string {
    switch(estado) {
      case 'en_progreso': return 'estado-progreso';
      case 'completado': return 'estado-completado';
      case 'revisado': return 'estado-revisado';
      default: return 'estado-pendiente';
    }
  }

  getEstadoTexto(estado: string = 'pendiente'): string {
    switch(estado) {
      case 'en_progreso': return '🔄 En progreso';
      case 'completado': return '📤 Completado';
      case 'revisado': return '⭐ Revisado';
      default: return '⏳ Pendiente';
    }
  }

  estaVencida(fechaLimite: string): boolean {
    return new Date(fechaLimite) < new Date();
  }

  navegarAGrabacion(practicaId: number): void {
    this.router.navigate(['/student/grabar-practica', practicaId]);
  }

  continuarPractica(practica: Evaluacion): void {
    if (practica.id) {
      this.router.navigate(['/student/grabar-practica', practica.id]);
    }
  }

  verDetalleResultado(practica: Evaluacion): void {
    if (practica.entrega_id) {
      this.router.navigate(['/student/resultado-practica', practica.entrega_id]);
    }
  }

  puedeReintentar(practica: Evaluacion): boolean {
    if (this.estaVencida(practica.fecha_limite)) {
      return false;
    }
    
    const reintentosPermitidos = practica.reintentos_permitidos || 1;
    const intentosRealizados = practica.intentos_realizados || 0;
    
    return intentosRealizados < reintentosPermitidos;
  }

reintentarPractica(practica: Evaluacion): void {
    if (!this.puedeReintentar(practica)) {
        alert('No puedes reintentar esta práctica.');
        return;
    }
    
    // ✅ Asegurar que estudianteId no es null
    if (!this.estudianteId) {
        alert('Error: No se pudo identificar al estudiante.');
        return;
    }
    
    this.reintentando[practica.id!] = true;
    this.cdr.detectChanges();
    
    this.entregasService.reiniciarEntrega(practica.id!, this.estudianteId).subscribe({
        next: (response) => {
            console.log('Práctica reiniciada:', response);
            
            practica.estado_entrega = 'pendiente';
            practica.intentos_realizados = response.intentos_realizados;
            practica.reintentos_permitidos = practica.reintentos_permitidos || 3;
            practica.nota = undefined;
            practica.precision = undefined;
            practica.videos_aprobados = undefined;
            practica.videos_total = undefined;
            practica.entrega_id = response.entrega_id;
            
            const index = this.practicasFiltradas.findIndex(p => p.id === practica.id);
            if (index !== -1) {
                this.practicasFiltradas[index] = { ...practica };
            }
            
            this.reintentando[practica.id!] = false;
            this.cdr.detectChanges();
            this.navegarAGrabacion(practica.id!);
        },
        error: (error) => {
            console.error('Error al reintentar:', error);
            this.reintentando[practica.id!] = false;
            alert('Error al reintentar la práctica.');
            this.cdr.detectChanges();
        }
    });
}

  getPracticasPendientes(): number {
    return this.practicas.filter(p => p.estado_entrega === 'pendiente').length;
  }

  getPracticasCompletadas(): number {
    return this.practicas.filter(p => p.estado_entrega === 'completado' || p.estado_entrega === 'revisado').length;
  }

  filtrarPorEstado(estado: string): void {
    this.filtroEstado = estado;
    this.filtrarPracticas();
  }

  filtrarPracticas(): void {
    let filtradas = [...this.practicas];
    
    if (this.filtroBusqueda) {
      filtradas = filtradas.filter(p => 
        p.titulo.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
      );
    }
    
    if (this.filtroEstado !== 'todos') {
      filtradas = filtradas.filter(p => p.estado_entrega === this.filtroEstado);
    }
    
    this.practicasFiltradas = filtradas;
    this.cdr.detectChanges();
  }
}