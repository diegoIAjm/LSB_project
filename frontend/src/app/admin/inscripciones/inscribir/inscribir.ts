import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CursosService } from '../../../services/cursos.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inscribir',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inscribir.html',
  styleUrls: ['./inscribir.css']
})
export class InscribirComponent implements OnInit {
  cursoSeleccionado: number | null = null;
  estudiantesSeleccionados: number[] = [];
  
  estudiantes: any[] = [];
  cursos: any[] = [];
  
  mensaje = '';
  error = '';
  cargando = false;
  cargandoDatos = true;

  constructor(
    private cursosService: CursosService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos() {
    this.cargandoDatos = true;
    
    this.cursosService.getCursosDisponibles().subscribe({
      next: (cursosRes: any) => {
        this.cursos = cursosRes;
        this.cargandoDatos = false;
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.error = 'Error al cargar los cursos';
        this.cargandoDatos = false;
        this.cd.detectChanges();
      }
    });
  }

  cargarEstudiantesPorCurso(cursoId: number) {
    if (!cursoId) return;
    
    this.cargandoDatos = true;
    
    this.cursosService.getEstudiantesDisponibles(cursoId).subscribe({
      next: (estudiantesRes: any) => {
        this.estudiantes = estudiantesRes;
        this.estudiantesSeleccionados = [];
        this.cargandoDatos = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar estudiantes:', err);
        this.cargandoDatos = false;
        this.cd.detectChanges();
      }
    });
  }

  onCursoChange(cursoId: number) {
    if (cursoId) {
      this.cargarEstudiantesPorCurso(cursoId);
    } else {
      this.estudiantes = [];
      this.estudiantesSeleccionados = [];
    }
  }

  volverInscripciones() {
    this.router.navigate(['/admin/inscripciones']);
  }

  toggleEstudiante(estudianteId: number) {
    const index = this.estudiantesSeleccionados.indexOf(estudianteId);
    if (index === -1) {
      this.estudiantesSeleccionados.push(estudianteId);
    } else {
      this.estudiantesSeleccionados.splice(index, 1);
    }
  }

  toggleTodosEstudiantes() {
    if (this.estudiantesSeleccionados.length === this.estudiantes.length) {
      this.estudiantesSeleccionados = [];
    } else {
      this.estudiantesSeleccionados = this.estudiantes.map(e => e.id);
    }
  }

  estaSeleccionado(estudianteId: number): boolean {
    return this.estudiantesSeleccionados.includes(estudianteId);
  }

  inscribir() {
    if (!this.cursoSeleccionado) {
      this.error = 'Debe seleccionar un curso';
      return;
    }

    if (this.estudiantesSeleccionados.length === 0) {
      this.error = 'Debe seleccionar al menos un estudiante';
      return;
    }

    this.cargando = true;
    this.error = '';

    const data = {
      curso: Number(this.cursoSeleccionado),
      estudiantes: this.estudiantesSeleccionados.map(id => Number(id))
    };

    console.log('📤 Enviando datos:', data);

    this.cursosService.inscribirMasivo(data).subscribe({
      next: (res: any) => {
        console.log('✅ Respuesta:', res);
        
        if (res.inscritos > 0) {
          this.mensaje = res.mensaje;
          setTimeout(() => {
            this.router.navigate(['/admin/inscripciones'], { 
              state: { mensaje: res.mensaje } 
            });
          }, 1500);
        } else {
          this.error = res.mensaje;
          this.cargando = false;
        }
      },
      error: (err: any) => {
        console.error('❌ Error:', err);
        
        if (err.error && typeof err.error === 'string' && err.error.includes('llave duplicada')) {
          this.error = 'Uno o más estudiantes ya tienen una inscripción en este curso';
        } else if (err.error?.mensaje) {
          this.error = err.error.mensaje;
        } else {
          this.error = 'Error al inscribir estudiantes';
        }
        this.cargando = false;
      }
    });
  }
}