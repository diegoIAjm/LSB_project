// src/app/teacher/crear-evaluacion/crear-evaluacion.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EvaluacionesService, Evaluacion } from '../../services/evaluaciones.service';
import { CursosService } from '../../services/cursos.service';
import { LeccionesService } from '../../services/lecciones.service'; // 🔹 Nuevo servicio
import { Observable } from 'rxjs';

@Component({
  selector: 'app-crear-evaluacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './crear-evaluacion.html',
  styleUrls: ['./crear-evaluacion.css']
})
export class CrearEvaluacionComponent implements OnInit {
  evaluacionForm!: FormGroup;
  cursoId: number = 0;
  cursoNombre: string = '';
  lecciones: any[] = [];
  loading = false;
  docenteId = 1; // TODO: Obtener del auth service

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionService: EvaluacionesService,
    private cursosService: CursosService,
    private leccionesService: LeccionesService  // 🔹 Servicio de lecciones
  ) {}

  ngOnInit(): void {
    this.cursoId = Number(this.route.snapshot.params['cursoId']);
    this.cursoNombre = this.route.snapshot.queryParams['cursoNombre'] || '';
    
    this.initForm();
    this.cargarLecciones();
    
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
      fecha_limite: ['', Validators.required]
    });
  }


// En el componente
cargarLecciones(): void {
  this.leccionesService.getLecciones().subscribe({
    next: (data: any) => {
      // Tomar los datos directamente
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

  onSubmit(): void {
    if (this.evaluacionForm.invalid) {
      Object.keys(this.evaluacionForm.controls).forEach(key => {
        this.evaluacionForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    
    const evaluacion: Evaluacion = {
      ...this.evaluacionForm.value,
      docente_id: this.docenteId
    };

    this.evaluacionService.createEvaluacion(evaluacion).subscribe({
      next: (response) => {
        console.log('Evaluación creada:', response);
        this.loading = false;
        alert(`✅ Práctica "${response.titulo}" asignada exitosamente al curso!`);
        this.router.navigate(['/teacher/asignar-practica']);
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.loading = false;
        alert('❌ Error al asignar la práctica');
      }
    });
  }

  volver(): void {
    this.router.navigate(['/teacher/asignar-practica']);
  }
}