import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DuolingoService, Leccion } from '../../../services/duolingo';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-duolingo-lecciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lecciones.html',
  styleUrls: ['./lecciones.css']
})
export class DuolingoLeccionesComponent implements OnInit {
  unidadId: number = 0;
  lecciones: Leccion[] = [];
  cargando = true;
  estudianteId: number | null = null;

  constructor(
    private duolingoService: DuolingoService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.unidadId = Number(this.route.snapshot.paramMap.get('unidadId'));
    const user = this.authService.getCurrentUser();
    this.estudianteId = user?.id || null;
    this.cargarLecciones();
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
    this.router.navigate(['/student/duolingo/ejercicio', leccion.id]);
  }

  volver(): void {
    this.router.navigate(['/student/duolingo/unidades', this.unidadId]);
  }

  getPrecision(leccion: Leccion): number | null {
    return leccion.progreso?.precision ?? null;
  }
}