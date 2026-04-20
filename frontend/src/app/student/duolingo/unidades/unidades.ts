import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DuolingoService, Unidad } from '../../../services/duolingo';

@Component({
  selector: 'app-duolingo-unidades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unidades.html',
  styleUrls: ['./unidades.css']
})
export class DuolingoUnidadesComponent implements OnInit {
  nivelId: number = 0;
  unidades: Unidad[] = [];
  cargando = true;

  constructor(
    private duolingoService: DuolingoService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.nivelId = Number(this.route.snapshot.paramMap.get('nivelId'));
    this.cargarUnidades();
  }

  cargarUnidades(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    
    this.duolingoService.getUnidades(this.nivelId).subscribe({
      next: (unidades) => {
        console.log('Unidades recibidas:', unidades);
        this.unidades = unidades;
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

  seleccionarUnidad(unidad: Unidad): void {
    this.router.navigate(['/student/duolingo/lecciones', unidad.id]);
  }

  volver(): void {
    this.router.navigate(['/student/duolingo/niveles']);
  }
}