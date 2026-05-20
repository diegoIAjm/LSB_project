// src/app/student/progreso/progreso.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ProgresoService, EstadisticasGlobales, ProgresoLeccion, EvolucionPrecision, RankingEstudiante } from '../../services/progreso.service';

@Component({
  selector: 'app-progreso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './progreso.html',
  styleUrls: ['./progreso.css']
})
export class ProgresoComponent implements OnInit {
  estadisticas: EstadisticasGlobales = {
    total_puntos: 0,
    promedio_precision: 0,
    total_ejercicios: 0,
    ejercicios_aprobados: 0,
    ejercicios_completados: 0,
    racha_dias: 0,
    nivel_actual: '',
    ultima_actualizacion: new Date(),
    lecciones_completadas: 0,
    total_lecciones: 0,
    porcentaje_completado: 0
  };
  
  progresoLecciones: ProgresoLeccion[] = [];
  evolucion: EvolucionPrecision[] = [];
  ranking: RankingEstudiante[] = [];
  
  cargando = true;
  estudianteId: number | null = null;
  private requestsCompleted = 0;
  private totalRequests = 4;

  constructor(
    private authService: AuthService,
    private progresoService: ProgresoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.obtenerEstudianteId();
  }

  obtenerEstudianteId(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      if ('estudiante_id' in user) {
        this.estudianteId = (user as any).estudiante_id;
      } else {
        const storedId = localStorage.getItem('estudiante_id');
        if (storedId) {
          this.estudianteId = parseInt(storedId, 10);
        }
      }
    }
    
    if (this.estudianteId) {
      this.cargarDatos();
    } else {
      console.warn('No se pudo obtener estudiante_id, usando ID de prueba 8');
      this.estudianteId = 8;
      this.cargarDatos();
    }
  }

  marcarCompletado(): void {
    this.requestsCompleted++;
    if (this.requestsCompleted === this.totalRequests) {
      this.cargando = false;
      this.crearGrafica();
      this.cdr.detectChanges();
    }
  }

  cargarDatos(): void {
    this.cargando = true;
    this.requestsCompleted = 0;
    
    this.progresoService.getEstadisticas(this.estudianteId!).subscribe({
      next: (data) => {
        console.log('Estadísticas recibidas:', data);
        this.estadisticas = data;
        this.marcarCompletado();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
        this.marcarCompletado();
      }
    });
    
    this.progresoService.getProgresoLecciones(this.estudianteId!).subscribe({
      next: (data) => {
        console.log('Progreso lecciones recibido:', data);
        this.progresoLecciones = data;
        this.marcarCompletado();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando progreso:', err);
        this.marcarCompletado();
      }
    });
    
    this.progresoService.getEvolucionPrecision(this.estudianteId!).subscribe({
      next: (data) => {
        console.log('Evolución recibida:', data);
        this.evolucion = data;
        this.marcarCompletado();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando evolución:', err);
        this.marcarCompletado();
      }
    });
    
    this.progresoService.getRankingGeneral(10).subscribe({
      next: (data) => {
        console.log('Ranking recibido:', data);
        this.ranking = data;
        this.marcarCompletado();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando ranking:', err);
        this.marcarCompletado();
      }
    });
  }

  obtenerColorPrecision(precision: number): string {
    if (precision >= 70) return '#4CAF50';
    if (precision >= 40) return '#FF9800';
    return '#f44336';
  }

  obtenerIconoRacha(dias: number): string {
    if (dias >= 30) return '🔥';
    if (dias >= 7) return '⚡';
    if (dias >= 1) return '✅';
    return '🌱';
  }

  // Para debug - mostrar si hay datos
  tieneDatos(): boolean {
    return this.progresoLecciones.length > 0 || this.evolucion.length > 0 || this.ranking.length > 0;
  }


  private chart: any = null;

crearGrafica(): void {
  const canvas = document.getElementById('precisionChart') as HTMLCanvasElement;
  if (!canvas || this.evolucion.length === 0) return;
  
  // Destruir gráfica anterior si existe
  if (this.chart) {
    this.chart.destroy();
  }
  
  const fechas = this.evolucion.map(item => {
    const fecha = new Date(item.fecha);
    return `${fecha.getDate()}/${fecha.getMonth() + 1}`;
  });
  
  const precisiones = this.evolucion.map(item => item.precision);
  
  import('chart.js/auto').then((Chart) => {
    this.chart = new Chart.default(canvas, {
      type: 'line',
      data: {
        labels: fechas,
        datasets: [{
          label: 'Precisión (%)',
          data: precisiones,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: precisiones.map(p => 
            p >= 70 ? '#4CAF50' : (p >= 40 ? '#FF9800' : '#f44336')
          ),
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: { callbacks: { label: (ctx) => `Precisión: ${ctx.raw}%` } }
        },
        scales: {
          y: { beginAtZero: true, max: 100, title: { display: true, text: 'Precisión (%)' } },
          x: { title: { display: true, text: 'Fecha' }, ticks: { maxRotation: 45, minRotation: 45 } }
        }
      }
    });
  });
}

}