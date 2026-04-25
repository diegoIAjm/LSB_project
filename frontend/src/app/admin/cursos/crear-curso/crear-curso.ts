// crear-curso.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CursosService, Docente, Nivel } from '../../../services/cursos.service';

@Component({
  selector: 'app-crear-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-curso.html',
  styleUrls: ['./crear-curso.css']
})
export class CrearCursoComponent implements OnInit {
  curso = {
    nombre: '',
    nivel: null as number | null,  // 🔹 AHORA ES ID del nivel
    modalidad: 'Virtual',
    fecha_inicio: '',
    fecha_fin: '',
    docente: null as number | null
  };

  // 🔹 NIVELES desde la API
  niveles: Nivel[] = [];

  docentes: Docente[] = [];
  mensaje = '';
  error = '';
  cargando = false;
  
  // Propiedades para duración
  duracionDias: number = 0;
  duracionMeses: number = 0;

  constructor(
    private cursosService: CursosService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarNiveles();
    this.cargarDocentes();
  }

  cargarNiveles() {
    console.log('Cargando niveles...');
    this.cursosService.getNiveles().subscribe({
      next: (res: Nivel[]) => {
        this.niveles = res;
        console.log('Niveles cargados:', this.niveles);
      },
      error: (err) => {
        console.error('Error al cargar niveles:', err);
      }
    });
  }

  cargarDocentes() {
    console.log('Cargando docentes...');
    this.cursosService.getDocentesDisponibles().subscribe({
      next: (res: any) => {
        this.docentes = res;
        console.log('Docentes cargados:', this.docentes);
      },
      error: (err) => {
        console.error('Error al cargar docentes:', err);
      }
    });
  }

  // 👈 Método para cuando cambia fecha_inicio
  onFechaInicioChange(nuevaFecha: string): void {
    console.log('🔄 Cambió fecha inicio:', nuevaFecha);
    this.curso.fecha_inicio = nuevaFecha;
    this.calcularDuracion();
  }

  // 👈 Método para cuando cambia fecha_fin
  onFechaFinChange(nuevaFecha: string): void {
    console.log('🔄 Cambió fecha fin:', nuevaFecha);
    this.curso.fecha_fin = nuevaFecha;
    this.calcularDuracion();
  }

  calcularDuracion(): void {
    if (this.curso.fecha_inicio && this.curso.fecha_fin) {
      const inicio = new Date(this.curso.fecha_inicio);
      const fin = new Date(this.curso.fecha_fin);
      
      if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        this.duracionDias = 0;
        this.duracionMeses = 0;
        return;
      }
      
      const diffDays = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      this.duracionDias = diffDays > 0 ? diffDays : 0;
      this.duracionMeses = Math.round(this.duracionDias / 30);
      
      console.log(`📅 Duración calculada: ${this.duracionDias} días (${this.duracionMeses} meses)`);
      this.cd.detectChanges();
    } else {
      this.duracionDias = 0;
      this.duracionMeses = 0;
    }
  }

  volverCursos() {
    this.router.navigate(['/admin/cursos']);
  }

  crearCurso() {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    const { nombre, nivel, modalidad, fecha_inicio, fecha_fin, docente } = this.curso;

    // Validaciones
    if (!nombre || !nivel || !modalidad || !fecha_inicio || !fecha_fin) {
      this.error = 'Todos los campos son obligatorios';
      this.cargando = false;
      return;
    }

    if (nombre.length < 3) {
      this.error = 'El nombre del curso debe tener al menos 3 caracteres';
      this.cargando = false;
      return;
    }

    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaInicio < hoy) {
      this.error = 'La fecha de inicio no puede ser anterior a hoy';
      this.cargando = false;
      return;
    }

    if (fechaFin <= fechaInicio) {
      this.error = 'La fecha de fin debe ser posterior a la fecha de inicio';
      this.cargando = false;
      return;
    }

    const diffDays = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 90 || diffDays > 150) {
      this.error = `El curso debe tener una duración aproximada de 4 meses (90-150 días). Actual: ${diffDays} días`;
      this.cargando = false;
      return;
    }

    const datosEnviar = {
      nombre: nombre,
      nivel: nivel,  // 🔹 Envía el ID del nivel
      modalidad: modalidad,
      fecha_inicio: fecha_inicio,
      fecha_fin: fecha_fin,
      docente: docente || null
    };

    console.log('📤 Enviando al backend:', JSON.stringify(datosEnviar));

    this.cursosService.crearCurso(datosEnviar).subscribe({
      next: (res: any) => {
        console.log('✅ Respuesta exitosa:', res);
        this.router.navigate(['/admin/cursos'], { 
          state: { mensaje: 'Curso creado correctamente' } 
        });
      },
      error: (err) => {
        console.error('❌ Error completo:', err);
        
        if (err.error?.nombre) {
          this.error = err.error.nombre;
        } else if (err.error?.nivel) {
          this.error = err.error.nivel;
        } else if (err.error?.fecha_inicio) {
          this.error = err.error.fecha_inicio;
        } else if (err.error?.fecha_fin) {
          this.error = err.error.fecha_fin;
        } else if (err.error?.fechas) {
          this.error = err.error.fechas;
        } else if (err.error?.docente) {
          this.error = err.error.docente;
        } else if (typeof err.error === 'string') {
          this.error = err.error;
        } else {
          this.error = err.error?.mensaje || 'Error al crear el curso';
        }
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }
}