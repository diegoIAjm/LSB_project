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
  modo: string = 'individual';
  
  inscripcionIndividual = {
    estudiante: null as number | null,
    curso: null as number | null
  };
  
  inscripcionMasiva = {
    curso: null as number | null,
    estudiantes: [] as number[]
  };
  
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
    this.cargarDatos();
  }

cargarDatos() {
  this.cargandoDatos = true;
  
  Promise.all([
    this.cursosService.getEstudiantesDisponibles().toPromise(),
    this.cursosService.getCursosDisponibles().toPromise()  // 🔹 Cambiar a getCursosDisponibles
  ]).then(([estudiantesRes, cursosRes]: any) => {
    this.estudiantes = estudiantesRes;
    this.cursos = cursosRes;
    this.cargandoDatos = false;
    this.cd.detectChanges();
  }).catch((err: any) => {
    console.error('Error:', err);
    this.error = 'Error al cargar los datos';
    this.cargandoDatos = false;
    this.cd.detectChanges();
  });
}

  volverInscripciones() {
    this.router.navigate(['/admin/inscripciones']);
  }

  cambiarModo(modo: string) {
    this.modo = modo;
    this.mensaje = '';
    this.error = '';
  }

  inscribirIndividual() {
    if (!this.inscripcionIndividual.estudiante || !this.inscripcionIndividual.curso) {
      this.error = 'Debe seleccionar un estudiante y un curso';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.cursosService.inscribirEstudiante(this.inscripcionIndividual).subscribe({
      next: (res: any) => {
        this.mensaje = res.mensaje;
        this.cargando = false;
        setTimeout(() => {
          this.router.navigate(['/admin/inscripciones'], { 
            state: { mensaje: 'Estudiante inscrito correctamente' } 
          });
        }, 1500);
      },
      error: (err: any) => {
        if (err.error?.non_field_errors) {
          this.error = err.error.non_field_errors[0];
        } else {
          this.error = err.error?.mensaje || 'Error al inscribir';
        }
        this.cargando = false;
      }
    });
  }

  toggleEstudiante(estudianteId: number) {
    const index = this.inscripcionMasiva.estudiantes.indexOf(estudianteId);
    if (index === -1) {
      this.inscripcionMasiva.estudiantes.push(estudianteId);
    } else {
      this.inscripcionMasiva.estudiantes.splice(index, 1);
    }
  }

  toggleTodosEstudiantes() {
    if (this.inscripcionMasiva.estudiantes.length === this.estudiantes.length) {
      this.inscripcionMasiva.estudiantes = [];
    } else {
      this.inscripcionMasiva.estudiantes = this.estudiantes.map(e => e.id);
    }
  }

  estaSeleccionado(estudianteId: number): boolean {
    return this.inscripcionMasiva.estudiantes.includes(estudianteId);
  }

inscribirMasivo() {
  if (!this.inscripcionMasiva.curso) {
    this.error = 'Debe seleccionar un curso';
    return;
  }

  if (this.inscripcionMasiva.estudiantes.length === 0) {
    this.error = 'Debe seleccionar al menos un estudiante';
    return;
  }

  this.cargando = true;
  this.error = '';

  const estudiantesNumeros = this.inscripcionMasiva.estudiantes.map(id => Number(id));

  const data = {
    curso: Number(this.inscripcionMasiva.curso),
    estudiantes: estudiantesNumeros
  };

  console.log('📤 Enviando datos masivos:', data);

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
        // Si no se inscribió nadie, mostrar errores
        this.error = res.mensaje;
        this.cargando = false;
      }
    },
    error: (err: any) => {
      console.error('❌ Error:', err);
      
      // 🔹 Manejar el error de duplicado de forma más amigable
      if (err.error && typeof err.error === 'string' && err.error.includes('llave duplicada')) {
        this.error = 'Uno o más estudiantes ya tienen una inscripción en este curso (activa o cancelada)';
      } else if (err.error?.mensaje) {
        this.error = err.error.mensaje;
      } else if (err.error?.error) {
        this.error = err.error.error;
      } else {
        this.error = 'Error al inscribir estudiantes. Verifique que no estén ya inscritos.';
      }
      this.cargando = false;
    }
  });
}
}