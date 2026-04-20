import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DuolingoService, Ejercicio, EvaluarRespuesta } from '../../../services/duolingo';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-duolingo-ejercicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ejercicio.html',
  styleUrls: ['./ejercicio.css']
})
export class DuolingoEjercicioComponent implements OnInit, OnDestroy {
  leccionId: number = 0;
  ejercicios: Ejercicio[] = [];
  ejercicioActual: Ejercicio | null = null;
  indiceActual: number = 0;
  cargando = true;
  evaluando = false;
  resultado: EvaluarRespuesta | null = null;
  estudianteId: number | null = null;
  puntuacionTotal: number = 0;
  precisionTotal: number = 0;
  ejerciciosCompletados: number = 0;

  constructor(
    private duolingoService: DuolingoService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef  // 🔹 Añadir ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.leccionId = Number(this.route.snapshot.paramMap.get('leccionId'));
    const user = this.authService.getCurrentUser();
    this.estudianteId = user?.id || null;
    this.cargarEjercicios();
  }

  ngOnDestroy(): void {
    // Limpiar recursos si es necesario
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
}