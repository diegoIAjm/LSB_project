import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CursosService, Horario } from '../../../services/cursos.service';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.html',
  styleUrls: ['./horarios.css']
})
export class HorariosComponent implements OnInit {
  cursoId: number = 0;
  cursoNombre: string = '';
  horarios: Horario[] = [];
  cargando = true;
  mostrarFormulario = false;
  editando = false;
  horarioEditandoId: number | null = null;
  
  nuevoHorario = {
    dia: '',
    hora_inicio: '',
    hora_fin: '',
    aula: '',
    enlace_virtual: ''
  };
  
  dias = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];
  
  mensaje = '';
  error = '';
  cargandoForm = false;

  constructor(
    private cursosService: CursosService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cursoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarCurso();
    this.cargarHorarios();
  }

  cargarCurso(): void {
    this.cursosService.getCurso(this.cursoId).subscribe({
      next: (curso: any) => {
        this.cursoNombre = curso.nombre;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar curso:', err)
    });
  }

  cargarHorarios(): void {
    this.cargando = true;
    this.cursosService.getHorarios(this.cursoId).subscribe({
      next: (horarios) => {
        this.horarios = horarios;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar horarios:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/cursos']);
  }

  mostrarFormularioNuevo(): void {
    this.mostrarFormulario = true;
    this.editando = false;
    this.horarioEditandoId = null;
    this.nuevoHorario = {
      dia: '',
      hora_inicio: '',
      hora_fin: '',
      aula: '',
      enlace_virtual: ''
    };
    this.error = '';
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.horarioEditandoId = null;
    this.error = '';
  }

  editarHorario(horario: Horario): void {
    this.mostrarFormulario = true;
    this.editando = true;
    this.horarioEditandoId = horario.id;
    this.nuevoHorario = {
      dia: horario.dia,
      hora_inicio: horario.hora_inicio.substring(0, 5),
      hora_fin: horario.hora_fin.substring(0, 5),
      aula: horario.aula || '',
      enlace_virtual: horario.enlace_virtual || ''
    };
  }

  eliminarHorario(id: number): void {
    const confirmar = confirm('¿Seguro que deseas eliminar este horario?');
    if (!confirmar) return;
    
    this.cursosService.eliminarHorario(id).subscribe({
      next: () => {
        this.mensaje = 'Horario eliminado correctamente';
        this.cargarHorarios();
        setTimeout(() => {
          this.mensaje = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.error = 'Error al eliminar horario';
        setTimeout(() => {
          this.error = '';
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

guardarHorario(): void {
  if (!this.nuevoHorario.dia || !this.nuevoHorario.hora_inicio || !this.nuevoHorario.hora_fin) {
    this.error = 'Día, hora de inicio y hora de fin son obligatorios';
    return;
  }
  
  this.cargandoForm = true;
  this.error = '';
  
  // 🔹 CORREGIDO: Usar undefined en lugar de null
  const datos = {
    curso: this.cursoId,
    dia: this.nuevoHorario.dia,
    hora_inicio: this.nuevoHorario.hora_inicio,
    hora_fin: this.nuevoHorario.hora_fin,
    aula: this.nuevoHorario.aula || undefined,
    enlace_virtual: this.nuevoHorario.enlace_virtual || undefined
  };
  
  if (this.editando && this.horarioEditandoId) {
    this.cursosService.actualizarHorario(this.horarioEditandoId, datos).subscribe({
      next: () => {
        this.mensaje = 'Horario actualizado correctamente';
        this.cancelarFormulario();
        this.cargarHorarios();
        setTimeout(() => {
          this.mensaje = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error al actualizar horario';
        this.cargandoForm = false;
        this.cdr.detectChanges();
      }
    });
  } else {
    this.cursosService.crearHorario(datos).subscribe({
      next: () => {
        this.mensaje = 'Horario creado correctamente';
        this.cancelarFormulario();
        this.cargarHorarios();
        setTimeout(() => {
          this.mensaje = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error al crear horario';
        this.cargandoForm = false;
        this.cdr.detectChanges();
      }
    });
  }
}
}