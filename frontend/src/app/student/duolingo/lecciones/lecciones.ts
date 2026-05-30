import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DuolingoService, Leccion } from '../../../services/duolingo';
import { AuthService } from '../../../services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-duolingo-lecciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lecciones.html',
  styleUrls: ['./lecciones.css']
})
export class DuolingoLeccionesComponent implements OnInit, OnDestroy {
  unidadId: number = 0;
  lecciones: Leccion[] = [];
  cargando = true;
  estudianteId: number | null = null;
  private routeSubscription!: Subscription;

  constructor(
    private duolingoService: DuolingoService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.estudianteId = user?.id || null;
    
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const nuevaUnidadId = Number(params.get('unidadId'));
      if (nuevaUnidadId !== this.unidadId) {
        this.unidadId = nuevaUnidadId;
        this.cargarLecciones();
      } else if (this.lecciones.length === 0) {
        this.cargarLecciones();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  cargarLecciones(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    
    this.duolingoService.getLecciones(this.unidadId, this.estudianteId || undefined).subscribe({
      next: (lecciones) => {
        console.log('Lecciones recibidas:', lecciones);
        this.lecciones = lecciones;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarLeccion(leccion: Leccion): void {
    // Solo permitir seleccionar si está desbloqueada
    if (!leccion.desbloqueada) {
      console.log('Lección bloqueada. Completa la lección anterior primero.');
      return;
    }
    this.router.navigate(['/student/duolingo/ejercicio', leccion.id]);
  }

  volver(): void {
    this.router.navigate(['/student/duolingo/unidades', this.unidadId]);
  }

  getPrecision(leccion: Leccion): number | null {
    return leccion.progreso?.precision ?? null;
  }

  // Obtener ícono según estado de la lección
getLeccionIcon(leccion: Leccion): string {
  if (leccion.progreso?.completado) {
    return '✅';
  }
  if (leccion.desbloqueada) {
    return '📘';
  }
  return '🔒';
}

// Obtener clase CSS según estado
getLeccionClase(leccion: Leccion): string {
  if (leccion.progreso?.completado) {
    return 'completada';
  }
  if (leccion.desbloqueada) {
    return 'desbloqueada';
  }
  return 'bloqueada';
}

// Verificar si se puede seleccionar
puedeSeleccionar(leccion: Leccion): boolean {
  return leccion.desbloqueada === true;
}

// Obtener clase de precisión
getPrecisionClase(precision: number): string {
  if (precision >= 70) return 'verde';
  if (precision >= 40) return 'amarillo';
  return 'rojo';
}
}