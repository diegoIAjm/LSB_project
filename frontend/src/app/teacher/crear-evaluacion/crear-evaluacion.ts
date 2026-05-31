// src/app/teacher/crear-evaluacion/crear-evaluacion.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EvaluacionesService, Evaluacion } from '../../services/evaluaciones.service';
import { CursosService } from '../../services/cursos.service';
import { LeccionesService } from '../../services/lecciones.service';
import { SenasService, Sena } from '../../services/senas.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-crear-evaluacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './crear-evaluacion.html',
  styleUrls: ['./crear-evaluacion.css']
})
export class CrearEvaluacionComponent implements OnInit {
  evaluacionForm!: FormGroup;
  cursoId: number = 0;
  cursoNombre: string = '';
  lecciones: any[] = [];
  senasDisponibles: Sena[] = [];
  senasFiltradas: Sena[] = [];
  senasSeleccionadas: { id: number; nombre: string }[] = [];
  busquedaSena: string = '';
  loading = false;
  cargandoSenas = false;
  docenteId = 1; // TODO: Obtener del auth service

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionService: EvaluacionesService,
    private cursosService: CursosService,
    private leccionesService: LeccionesService,
    private senasService: SenasService
  ) {}

  ngOnInit(): void {
    this.cursoId = Number(this.route.snapshot.params['cursoId']);
    this.cursoNombre = this.route.snapshot.queryParams['cursoNombre'] || '';
    
    this.initForm();
    this.cargarLecciones();
    this.cargarSenas();
    
    if (this.cursoId) {
      this.evaluacionForm.patchValue({ curso_id: this.cursoId });
    }
  }

  initForm(): void {
    this.evaluacionForm = this.fb.group({
      curso_id: [this.cursoId, Validators.required],
      leccion_id: ['', Validators.required],
      titulo: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: ['', Validators.required],
      fecha_limite: ['', Validators.required],
      tiempo_estimado_minutos: [30],
      reintentos_permitidos: [1]
    });
  }

  cargarLecciones(): void {
    this.leccionesService.getLecciones().subscribe({
      next: (data: any) => {
        this.lecciones = data.results || data;
        if (!Array.isArray(this.lecciones)) {
          this.lecciones = [];
        }
        console.log('Lecciones cargadas:', this.lecciones);
      },
      error: (error: any) => {
        console.error('Error cargando lecciones:', error);
        this.lecciones = [];
      }
    });
  }

  cargarSenas(): void {
    this.cargandoSenas = true;
    this.senasService.getSenas().subscribe({
      next: (senas: Sena[]) => {
        this.senasDisponibles = senas;
        this.senasFiltradas = [...senas];
        this.cargandoSenas = false;
        console.log('Señas cargadas:', this.senasDisponibles.length);
      },
      error: (error) => {
        console.error('Error cargando señas:', error);
        this.cargandoSenas = false;
      }
    });
  }

  filtrarSenas(): void {
    const busqueda = this.busquedaSena.toLowerCase();
    this.senasFiltradas = this.senasDisponibles.filter(sena => 
      sena.nombre.toLowerCase().includes(busqueda)
    );
  }

  isSenaSelected(senaId: number): boolean {
    return this.senasSeleccionadas.some(s => s.id === senaId);
  }

  toggleSena(senaId: number, senaNombre: string): void {
    if (this.isSenaSelected(senaId)) {
      this.senasSeleccionadas = this.senasSeleccionadas.filter(s => s.id !== senaId);
    } else {
      this.senasSeleccionadas.push({ id: senaId, nombre: senaNombre });
    }
    this.evaluacionForm.get('senasSeleccionadas')?.markAsTouched();
  }

  removeSena(senaId: number): void {
    this.senasSeleccionadas = this.senasSeleccionadas.filter(s => s.id !== senaId);
  }

  onLeccionChange(): void {
    // Puedes cargar señas relacionadas a la lección si es necesario
  }

  onSubmit(): void {
    if (this.evaluacionForm.invalid) {
      Object.keys(this.evaluacionForm.controls).forEach(key => {
        this.evaluacionForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.senasSeleccionadas.length === 0) {
      alert('❌ Debe seleccionar al menos una seña');
      return;
    }

    this.loading = true;
    
    // Convertir fecha_limite a formato ISO
    let fechaLimite = this.evaluacionForm.value.fecha_limite;
    if (fechaLimite && !fechaLimite.includes('T')) {
      fechaLimite = `${fechaLimite}T23:59:59`;
    }

    const evaluacionData = {
      curso_id: this.evaluacionForm.value.curso_id,
      leccion_id: this.evaluacionForm.value.leccion_id,
      docente_id: this.docenteId,
      titulo: this.evaluacionForm.value.titulo,
      descripcion: this.evaluacionForm.value.descripcion,
      fecha_limite: fechaLimite,
      tiempo_estimado_minutos: this.evaluacionForm.value.tiempo_estimado_minutos,
      reintentos_permitidos: this.evaluacionForm.value.reintentos_permitidos,
      senas: this.senasSeleccionadas.map(s => s.id)  // Array de IDs de señas
    };

    this.evaluacionService.createEvaluacion(evaluacionData).subscribe({
      next: (response) => {
        console.log('Evaluación creada:', response);
        this.loading = false;
        alert(`✅ Práctica "${response.titulo}" asignada exitosamente al curso con ${this.senasSeleccionadas.length} señas!`);
        this.router.navigate(['/teacher/asignar-practica']);
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.loading = false;
        alert('❌ Error al asignar la práctica: ' + (error.error?.error || error.message));
      }
    });
  }

  volver(): void {
    this.router.navigate(['/teacher/asignar-practica']);
  }
}