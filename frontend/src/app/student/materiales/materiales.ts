// src/app/student/materiales/materiales.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialesService, Material, MaterialesResponse } from '../../services/materiales.service';
import { CursosService, Curso } from '../../services/cursos.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-materiales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './materiales.html',
  styleUrls: ['./materiales.css']
})
export class MaterialesComponent implements OnInit {
  cursos: Curso[] = [];
  materiales: Material[] = [];
  cursoSeleccionado: Curso | null = null;
  cargando = true;
  vistaActual: 'cursos' | 'materiales' = 'cursos';

  constructor(
    private materialesService: MaterialesService,
    private cursosService: CursosService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.cargando = true;
    // Usar getCursos() sin filtros para obtener todos los cursos activos
    this.cursosService.getCursos({}).subscribe({
      next: (response: any) => {
        // El endpoint devuelve { cursos: [], total: number }
        this.cursos = response.cursos || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando cursos:', err);
        this.cargando = false;
      }
    });
  }

  seleccionarCurso(curso: Curso): void {
    this.cursoSeleccionado = curso;
    this.cargarMateriales(curso.id);
  }

  cargarMateriales(cursoId: number): void {
    this.cargando = true;
    this.materialesService.getMateriales(cursoId).subscribe({
      next: (response: MaterialesResponse) => {
        this.materiales = response.materiales || [];
        this.vistaActual = 'materiales';
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando materiales:', err);
        this.materiales = [];
        this.cargando = false;
      }
    });
  }

  volverACursos(): void {
    this.vistaActual = 'cursos';
    this.cursoSeleccionado = null;
    this.materiales = [];
  }

  getIconoTipo(tipo: string): string {
    switch(tipo) {
      case 'pdf': return '📄';
      case 'video': return '🎬';
      case 'imagen': return '🖼️';
      case 'documento': return '📑';
      default: return '📁';
    }
  }

  getColorTipo(tipo: string): string {
    switch(tipo) {
      case 'pdf': return '#ef4444';
      case 'video': return '#3b82f6';
      case 'imagen': return '#10b981';
      case 'documento': return '#f59e0b';
      default: return '#64748b';
    }
  }

  abrirMaterial(material: Material): void {
    const url = material.archivo_url || material.archivo;
    if (url) {
      window.open(url, '_blank');
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  // Agrega este método después de getColorTipo
getTipoTexto(tipo: string): string {
  switch(tipo) {
    case 'pdf': return 'PDF';
    case 'video': return 'Video';
    case 'imagen': return 'Imagen';
    case 'documento': return 'Documento';
    default: return tipo.toUpperCase();
  }
}
}