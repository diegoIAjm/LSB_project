import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';  // 🔹 Importar forkJoin
import { CursosService, Docente } from '../../../services/cursos.service';

@Component({
  selector: 'app-editar-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-curso.html',
  styleUrls: ['./editar-curso.css']
})
export class EditarCursoComponent implements OnInit {
  curso = {
    id: 0,
    nombre: '',
    nivel: '',
    fecha_inicio: '',
    fecha_fin: '',
    docente: null as number | null,
    estado: ''
  };

  niveles = [
    { value: 'basico', label: 'Básico' },
    { value: 'avanzado', label: 'Avanzado' }
  ];

  estados = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'finalizado', label: 'Finalizado' }
  ];

  docentes: Docente[] = [];
  mensaje = '';
  error = '';
  cargando = false;
  cargandoDatos = true;

  constructor(
    private cursosService: CursosService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.cargarDatos(id);
    } else {
      this.error = 'ID de curso no proporcionado';
      this.cargandoDatos = false;
    }
  }

  // 🔹 Cargar curso y docentes en paralelo
  cargarDatos(id: number): void {
    this.cargandoDatos = true;
    
    // Usar forkJoin para cargar ambas cosas en paralelo
    forkJoin({
      curso: this.cursosService.getCurso(id),
      docentes: this.cursosService.getDocentesDisponibles()
    }).subscribe({
      next: (resultado: any) => {
        console.log('Curso recibido:', resultado.curso);
        console.log('Docentes recibidos:', resultado.docentes);
        
        // Asignar docentes
        this.docentes = resultado.docentes;
        
        // Asignar curso
        this.curso = {
          id: resultado.curso.id,
          nombre: resultado.curso.nombre,
          nivel: resultado.curso.nivel,
          fecha_inicio: resultado.curso.fecha_inicio,
          fecha_fin: resultado.curso.fecha_fin,
          docente: resultado.curso.docente || null,
          estado: resultado.curso.estado || 'activo'
        };
        
        this.cargandoDatos = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.error = 'Error al cargar los datos del curso';
        this.cargandoDatos = false;
        this.cd.detectChanges();
      }
    });
  }

  volverCursos() {
    this.router.navigate(['/admin/cursos']);
  }

  calcularDuracion(): number {
    if (this.curso.fecha_inicio && this.curso.fecha_fin) {
      const inicio = new Date(this.curso.fecha_inicio);
      const fin = new Date(this.curso.fecha_fin);
      const diffDays = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  }

  calcularMeses(): number {
    const dias = this.calcularDuracion();
    return Math.round(dias / 30);
  }

  actualizarCurso() {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    const { nombre, nivel, fecha_inicio, fecha_fin, docente, estado } = this.curso;

    if (!nombre || !nivel || !fecha_inicio || !fecha_fin) {
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
      this.error = 'El curso debe tener una duración aproximada de 4 meses (90-150 días)';
      this.cargando = false;
      return;
    }

    const datosEnviar = {
      nombre: nombre,
      nivel: nivel,
      fecha_inicio: fecha_inicio,
      fecha_fin: fecha_fin,
      docente: docente || null,
      estado: estado
    };

    console.log('📤 Actualizando curso:', datosEnviar);

    this.cursosService.editarCurso(this.curso.id, datosEnviar).subscribe({
      next: (res: any) => {
        console.log('✅ Respuesta:', res);
        this.router.navigate(['/admin/cursos'], { 
          state: { mensaje: 'Curso actualizado correctamente' } 
        });
      },
      error: (err) => {
        console.error('❌ Error:', err);
        
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
        } else if (err.error?.estado) {
          this.error = err.error.estado;
        } else if (typeof err.error === 'string') {
          this.error = err.error;
        } else {
          this.error = err.error?.mensaje || 'Error al actualizar el curso';
        }
        this.cargando = false;
      }
    });
  }
}