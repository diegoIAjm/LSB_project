// editar-curso.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CursosService, Docente, Nivel } from '../../../services/cursos.service';

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
    nivel: null as number | null,
    modalidad: 'Virtual',
    fecha_inicio: '',
    fecha_fin: '',
    docente: null as number | null,
    estado: ''
  };

  niveles: Nivel[] = [];
  duracionDias: number = 0;
  duracionMeses: number = 0;

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

  cargarDatos(id: number): void {
    this.cargandoDatos = true;
    
    forkJoin({
      curso: this.cursosService.getCurso(id),
      niveles: this.cursosService.getNiveles(),
      docentes: this.cursosService.getDocentesDisponibles()
    }).subscribe({
      next: (resultado: any) => {
        console.log('Curso recibido:', resultado.curso);
        
        this.niveles = resultado.niveles;
        this.docentes = resultado.docentes;
        
        this.curso = {
          id: resultado.curso.id,
          nombre: resultado.curso.nombre,
          nivel: resultado.curso.nivel,
          modalidad: resultado.curso.modalidad || 'Virtual',
          fecha_inicio: resultado.curso.fecha_inicio || '',
          fecha_fin: resultado.curso.fecha_fin || '',
          docente: resultado.curso.docente || null,
          estado: resultado.curso.estado || 'activo'
        };
        
        // Calcular duración inicial
        setTimeout(() => {
          this.calcularDuracion();
        }, 100);
        
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
    console.log('🔹 Calculando duración...');
    console.log('  fecha_inicio:', this.curso.fecha_inicio);
    console.log('  fecha_fin:', this.curso.fecha_fin);
    
    if (this.curso.fecha_inicio && this.curso.fecha_fin) {
      const inicio = new Date(this.curso.fecha_inicio);
      const fin = new Date(this.curso.fecha_fin);
      
      if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        console.log('❌ Fechas inválidas');
        this.duracionDias = 0;
        this.duracionMeses = 0;
        return;
      }
      
      const diffTime = fin.getTime() - inicio.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      this.duracionDias = diffDays > 0 ? diffDays : 0;
      this.duracionMeses = Math.round(this.duracionDias / 30);
      
      console.log(`✅ Duración calculada: ${this.duracionDias} días (${this.duracionMeses} meses)`);
      
      // Forzar actualización de la vista
      this.cd.detectChanges();
    } else {
      console.log('⚠️ Fechas incompletas');
      this.duracionDias = 0;
      this.duracionMeses = 0;
    }
  }

  volverCursos() {
    this.router.navigate(['/admin/cursos']);
  }

  actualizarCurso() {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    const { nombre, nivel, modalidad, fecha_inicio, fecha_fin, docente, estado } = this.curso;

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

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      this.error = 'Las fechas no son válidas';
      this.cargando = false;
      return;
    }

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
      nivel: nivel,
      modalidad: modalidad,
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
        this.error = err.error?.mensaje || err.error?.fechas || 'Error al actualizar el curso';
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }
}