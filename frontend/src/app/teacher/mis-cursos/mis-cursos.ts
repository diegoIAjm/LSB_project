import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CursosService } from '../../services/cursos.service';
import { AuthService, User } from '../../services/auth';

@Component({
  selector: 'app-mis-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mis-cursos.html',
  styleUrls: ['./mis-cursos.css']
})
export class MisCursosComponent implements OnInit {
  cursos: any[] = [];
  cursosFiltrados: any[] = [];
  cargando = true;
  
  filtroEstado = '';
  filtroBusqueda = '';
  
  estados = [
    { value: '', label: 'Todos' },
    { value: 'activo', label: 'Activos' },
    { value: 'inactivo', label: 'Inactivos' },
    { value: 'finalizado', label: 'Finalizados' }
  ];

  constructor(
    private cursosService: CursosService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    
    const user = this.authService.getCurrentUser();
    const usuarioId = user?.id;
    
    console.log('Usuario ID:', usuarioId);
    
    if (!usuarioId) {
      console.error('Usuario no logueado');
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }
    
    this.cursosService.getDocenteByUsuarioId(usuarioId).subscribe({
      next: (docente: any) => {
        console.log('Docente encontrado:', docente);
        
        const filtros: any = {};
        if (docente && docente.id) {
          filtros.docente = docente.id;
        }
        
        this.cursosService.getCursos(filtros).subscribe({
          next: (res: any) => {
            console.log('Cursos recibidos:', res);
            
            this.cursos = res.cursos || [];
            this.cursosFiltrados = [...this.cursos];
            this.cargando = false;
            
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 0);
          },
          error: (err) => {
            console.error('Error al cargar cursos:', err);
            this.cargando = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener docente:', err);
        this.cursos = [];
        this.cursosFiltrados = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarCursos(): void {
    this.cursosFiltrados = this.cursos.filter(curso => {
      if (this.filtroEstado && curso.estado !== this.filtroEstado) {
        return false;
      }
      if (this.filtroBusqueda && !curso.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase())) {
        return false;
      }
      return true;
    });
    this.cdr.detectChanges();
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.filtroBusqueda = '';
    this.cursosFiltrados = [...this.cursos];
    this.cdr.detectChanges();
  }

  getEstadoClass(estado: string): string {
    switch(estado) {
      case 'activo': return 'estado-activo';
      case 'inactivo': return 'estado-inactivo';
      case 'finalizado': return 'estado-finalizado';
      default: return '';
    }
  }

  getEstadoTexto(estado: string): string {
    switch(estado) {
      case 'activo': return 'Activo';
      case 'inactivo': return 'Inactivo';
      case 'finalizado': return 'Finalizado';
      default: return estado;
    }
  }

  getNivelTexto(nivel: string): string {
    switch(nivel) {
      case 'basico': return 'Básico';
      case 'avanzado': return 'Avanzado';
      default: return nivel;
    }
  }

  getDuracionTexto(fechaInicio: string, fechaFin: string): string {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffDays = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    const meses = Math.round(diffDays / 30);
    return `${meses} meses (${diffDays} días)`;
  }
}