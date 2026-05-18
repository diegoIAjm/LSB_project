// src/app/student/mis-practicas/mis-practicas.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router} from '@angular/router';
import { EvaluacionesService, Evaluacion } from '../../services/evaluaciones.service';
import { EntregasService, Entrega } from '../../services/entregas.service';

@Component({
  selector: 'app-mis-practicas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mis-practicas.html',
  styleUrls: ['./mis-practicas.css']
})
export class MisPracticasComponent implements OnInit {
  practicas: Evaluacion[] = [];
  practicasFiltradas: Evaluacion[] = [];
  cargando = false;
  filtroBusqueda = '';
  estudianteId = 1;
  marcando: { [key: number]: boolean } = {};
  verificando = false;

  constructor(
    private evaluacionService: EvaluacionesService,
    private entregasService: EntregasService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPracticas();
  }

  cargarPracticas(): void {
    this.cargando = true;
    this.evaluacionService.getEvaluaciones().subscribe({
      next: (data: Evaluacion[]) => {
        this.practicas = data;
        this.practicasFiltradas = [...data];
        // Una vez cargadas las prácticas, verificamos los estados una por una
        this.verificarEstadosSecuencial();
      },
      error: (error: any) => {
        console.error('Error cargando prácticas:', error);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

verificarEstadosSecuencial(): void {
  this.verificando = true;
  let completadas = 0;
  
  this.practicas.forEach(practica => {
    this.entregasService.getEstadoEntrega(practica.id!, this.estudianteId).subscribe({
      next: (entrega: Entrega | null) => {
        if (entrega && entrega.estado) {
          console.log(`Práctica ${practica.id} - Estado: ${entrega.estado}`);
          practica.estado_entrega = entrega.estado;
          practica.entrega_id = entrega.id;
          
          // 🔹 NUEVO: Si está revisado, cargar el resultado
          if (entrega.estado === 'revisado' && entrega.id) {
            this.cargarResultado(practica, entrega.id);
          }
        } else {
          console.log(`Práctica ${practica.id} - Sin entrega (pendiente)`);
          practica.estado_entrega = 'pendiente';
        }
        
        completadas++;
        if (completadas === this.practicas.length) {
          this.verificando = false;
          this.cargando = false;
          this.filtrarPracticas();
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error(`Error verificando práctica ${practica.id}:`, error);
        practica.estado_entrega = 'pendiente';
        completadas++;
        
        if (completadas === this.practicas.length) {
          this.verificando = false;
          this.cargando = false;
          this.filtrarPracticas();
          this.cdr.detectChanges();
        }
      }
    });
  });
}

cargarResultado(practica: Evaluacion, entregaId: number): void {
  this.entregasService.getResultadoEntrega(entregaId).subscribe({
    next: (response: any) => {
      console.log(`Respuesta resultado para práctica ${practica.id}:`, response);
      
      // Verificar diferentes estructuras de respuesta
      if (response && response.resultado) {
        practica.nota = response.resultado.nota;
        practica.precision = response.resultado.precision;
        practica.feedback = response.resultado.observaciones;
      } else if (response && response.nota) {
        practica.nota = response.nota;
        practica.precision = response.precision;
        practica.feedback = response.observaciones;
      }
      
      console.log(`Resultado cargado: nota=${practica.nota}, precisión=${practica.precision}`);
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error(`Error cargando resultado para práctica ${practica.id}:`, error);
    }
  });
}

  filtrarPracticas(): void {
    if (this.filtroBusqueda) {
      this.practicasFiltradas = this.practicas.filter(practica =>
        practica.titulo.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
      );
    } else {
      this.practicasFiltradas = [...this.practicas];
    }
    this.cdr.detectChanges();
  }

  marcarEntregado(practica: Evaluacion): void {
    if (!confirm(`¿Estás seguro de que quieres marcar "${practica.titulo}" como entregada?`)) {
      return;
    }

    this.marcando[practica.id!] = true;
    this.cdr.detectChanges();

    const videoUrl = prompt('Ingresa la URL de tu video (YouTube, Drive, etc.):', '');
    
    if (!videoUrl) {
      this.marcando[practica.id!] = false;
      this.cdr.detectChanges();
      return;
    }

    this.entregasService.marcarComoEntregado(
      practica.id!,
      this.estudianteId,
      videoUrl
    ).subscribe({
      next: (response) => {
        console.log('Entrega registrada:', response);
        
        // Actualizar el estado local
        practica.estado_entrega = 'entregado';
        practica.entrega_id = response.id;
        
        this.marcando[practica.id!] = false;
        
        // Actualizar también en practicasFiltradas
        const index = this.practicasFiltradas.findIndex(p => p.id === practica.id);
        if (index !== -1) {
          this.practicasFiltradas[index].estado_entrega = 'entregado';
        }
        
        this.cdr.detectChanges();
        alert('✅ Práctica marcada como entregada');
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.marcando[practica.id!] = false;
        this.cdr.detectChanges();
        alert('❌ Error al marcar como entregada. Intenta nuevamente.');
      }
    });
  }

  getEstadoBadgeClass(estado: string = 'pendiente'): string {
    switch(estado) {
      case 'entregado': return 'estado-entregado';
      case 'revisado': return 'estado-revisado';
      default: return 'estado-pendiente';
    }
  }

  getEstadoTexto(estado: string = 'pendiente'): string {
    switch(estado) {
      case 'entregado': return '✅ Entregado';
      case 'revisado': return '⭐ Revisado';
      default: return '⏳ Pendiente';
    }
  }

  estaVencida(fechaLimite: string): boolean {
    return new Date(fechaLimite) < new Date();
  }

  navegarAGrabacion(practicaId: number): void {
    this.router.navigate(['/student/grabar-practica', practicaId]);
  }
  verDetalleResultado(practica: Evaluacion): void {
  alert(`📊 RESULTADO DE LA PRÁCTICA\n\n` +
        `📝 Práctica: ${practica.titulo}\n` +
        `⭐ Nota: ${practica.nota || 0}/5\n` +
        `🎯 Precisión: ${practica.precision || 0}%\n\n` +
        `💬 Feedback:\n${practica.feedback || 'Sin feedback adicional'}`);
}
}