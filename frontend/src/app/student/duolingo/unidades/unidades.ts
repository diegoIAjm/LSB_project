import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DuolingoService, Unidad } from '../../../services/duolingo';
import { AuthService } from '../../../services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-duolingo-unidades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unidades.html',
  styleUrls: ['./unidades.css']
})
export class DuolingoUnidadesComponent implements OnInit, OnDestroy {
  nivelId: number = 0;
  unidades: Unidad[] = [];
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
    // Obtener ID del estudiante
    const user = this.authService.getCurrentUser();
    this.estudianteId = user?.id || null;
    
    // Suscribirse a los cambios en los parámetros de la ruta
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const nuevoNivelId = Number(params.get('nivelId'));
      if (nuevoNivelId !== this.nivelId) {
        this.nivelId = nuevoNivelId;
        this.cargarUnidades();
      } else if (this.unidades.length === 0) {
        this.cargarUnidades();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  cargarUnidades(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    
    // Pasar estudianteId para obtener progreso y estado de desbloqueo
    this.duolingoService.getUnidades(this.nivelId, this.estudianteId || undefined).subscribe({
      next: (unidades) => {
        console.log('Unidades recibidas:', unidades);
        this.unidades = unidades;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando unidades:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarUnidad(unidad: Unidad): void {
    // Verificar si la unidad está desbloqueada
    if (!unidad.desbloqueada) {
      console.log('Unidad bloqueada. Completa la unidad anterior primero.');
      return;
    }
    this.router.navigate(['/student/duolingo/lecciones', unidad.id]);
  }

  volver(): void {
    this.router.navigate(['/student/duolingo/niveles']);
  }

  // Obtener ícono según estado de la unidad
  getUnidadIcon(unidad: Unidad): string {
    if (unidad.progreso === 100) {
      return '✅';
    }
    if (unidad.desbloqueada) {
      return '📘';
    }
    return '🔒';
  }

  // Obtener clase CSS según estado de la unidad
  getUnidadClase(unidad: Unidad): string {
    if (unidad.progreso === 100) {
      return 'completada';
    }
    if (unidad.desbloqueada) {
      return 'desbloqueada';
    }
    return 'bloqueada';
  }

  // Verificar si se puede seleccionar la unidad
  puedeSeleccionar(unidad: Unidad): boolean {
    return unidad.desbloqueada === true;
  }
}