import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DuolingoService, Nivel } from '../../../services/duolingo';

@Component({
  selector: 'app-duolingo-niveles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './niveles.html',
  styleUrls: ['./niveles.css']
})
export class DuolingoNivelesComponent implements OnInit {
  niveles: Nivel[] = [];
  cargando = true;

  constructor(
    private duolingoService: DuolingoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarNiveles();
  }

  cargarNiveles(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    
    this.duolingoService.getNiveles().subscribe({
      next: (niveles) => {
        console.log('Niveles recibidos:', niveles);
        this.niveles = niveles;
        this.cargando = false;
        this.cdr.detectChanges(); // 🔹 Forzar actualización
      },
      error: (err) => {
        console.error('Error:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarNivel(nivel: Nivel): void {
    this.router.navigate(['/student/duolingo/unidades', nivel.id]);
  }
}