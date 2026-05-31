// src/app/teacher/asignar-practica/asignar-practica.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CursosService } from '../../services/cursos.service';

@Component({
  selector: 'app-asignar-practica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asignar-practica.html',
  styleUrls: ['./asignar-practica.css']
})
export class AsignarPracticaComponent implements OnInit {
  cursos: any[] = [];
  cursosFiltrados: any[] = [];
  cargando = true;
  filtroBusqueda = '';
  docenteId = 1;

  constructor(
    private cursosService: CursosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.cargando = true;
    
    this.cursosService.getCursos({ docente_id: this.docenteId }).subscribe({
      next: (response: any) => {
        console.log('Respuesta completa:', response);
        
        let cursosData = [];
        
        if (response && response.cursos && Array.isArray(response.cursos)) {
          cursosData = response.cursos;
        } else if (response && response.results && Array.isArray(response.results)) {
          cursosData = response.results;
        } else if (Array.isArray(response)) {
          cursosData = response;
        }
        
        this.cursos = cursosData;
        this.cursosFiltrados = [...cursosData];
        
        console.log('Cursos cargados:', this.cursos);
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar cursos:', error);
        this.cargando = false;
        this.cursos = [];
        this.cursosFiltrados = [];
      }
    });
  }

  filtrarCursos(): void {
    console.log('Filtrando cursos con:', this.filtroBusqueda);
    
    if (this.filtroBusqueda && this.filtroBusqueda.trim() !== '') {
      this.cursosFiltrados = this.cursos.filter(curso =>
        curso.nombre && curso.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
      );
    } else {
      this.cursosFiltrados = [...this.cursos];
    }
    
    console.log('Cursos filtrados:', this.cursosFiltrados);
  }

  getIconoPorNivel(nivel: number): string {
    if (nivel === 1) return '🌟';
    if (nivel === 2) return '🚀';
    if (nivel === 3) return '🏆';
    return '📚';
  }

  asignarPractica(cursoId: number, cursoNombre: string): void {
    console.log('Asignar práctica a:', cursoId, cursoNombre);
    this.router.navigate(['/teacher/crear-evaluacion', cursoId], {
      queryParams: { cursoNombre: cursoNombre }
    });
  }

verEntregas(cursoId: number, cursoNombre: string): void {
  this.router.navigate(['/teacher/entregas-cursos', cursoId], {
    queryParams: { cursoNombre: cursoNombre }
  });
}
}