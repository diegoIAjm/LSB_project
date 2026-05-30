// src/app/student/progreso/progreso.ts
import { Component, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ProgresoService, EstadisticasGlobales, ProgresoLeccion, EvolucionPrecision, RankingEstudiante } from '../../services/progreso.service';

// Importar Highcharts correctamente
import * as Highcharts from 'highcharts';
import HC_3D from 'highcharts/highcharts-3d';

// Inicializar el módulo 3D
HC_3D(Highcharts);

@Component({
  selector: 'app-progreso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './progreso.html',
  styleUrls: ['./progreso.css']
})
export class ProgresoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
  
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
    porcentaje_completado: 0,
    mejora_total: 0,
    mejor_sesion: 0,
    total_sesiones: 0
  };
  
  progresoLecciones: ProgresoLeccion[] = [];
  evolucion: EvolucionPrecision[] = [];
  ranking: RankingEstudiante[] = [];
  
  cargando = true;
  estudianteId: number | null = null;
  private requestsCompleted = 0;
  private totalRequests = 4;
  private chart: any = null;

  constructor(
    private authService: AuthService,
    private progresoService: ProgresoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.obtenerEstudianteId();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.cargando && this.evolucion.length > 0) {
        this.create3DChart();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
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
      this.cdr.detectChanges();
      setTimeout(() => {
        if (this.evolucion.length > 0) {
          this.create3DChart();
        }
      }, 500);
    }
  }

  cargarDatos(): void {
    this.cargando = true;
    this.requestsCompleted = 0;
    
    this.progresoService.getEstadisticas(this.estudianteId!).subscribe({
      next: (data) => {
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
        this.evolucion = data;
        this.marcarCompletado();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando evolución:', err);
        this.evolucion = this.generarDatosEjemplo();
        this.marcarCompletado();
      }
    });
    
    this.progresoService.getRankingGeneral(10).subscribe({
      next: (data) => {
        this.ranking = data.map(estudiante => ({
          ...estudiante,
          esUsuarioActual: estudiante.id === this.estudianteId
        }));
        this.marcarCompletado();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando ranking:', err);
        this.marcarCompletado();
      }
    });
  }

  generarDatosEjemplo(): EvolucionPrecision[] {
    const datos = [];
    const hoy = new Date();
    for (let i = 9; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      datos.push({
        fecha: fecha.toISOString(),
        precision: Math.floor(Math.random() * 60) + 30,
        ejercicio_nombre: `Ejercicio ${i + 1}`
      });
    }
    return datos;
  }

  obtenerColorPrecision(precision: number): string {
    if (precision >= 70) return '#4CAF50';
    if (precision >= 40) return '#FF9800';
    return '#f44336';
  }

  obtenerBgPrecision(precision: number): string {
    if (precision >= 70) return '#e8f5e9';
    if (precision >= 40) return '#fff3e0';
    return '#ffebee';
  }

  obtenerIconoRacha(dias: number): string {
    if (dias >= 30) return '🔥';
    if (dias >= 7) return '⚡';
    if (dias >= 1) return '✅';
    return '🌱';
  }

  esEstudianteActual(estudiante: RankingEstudiante): boolean {
    return estudiante.id === this.estudianteId;
  }

  tieneDatos(): boolean {
    return this.progresoLecciones.length > 0 || this.evolucion.length > 0 || this.ranking.length > 0;
  }

create3DChart(): void {
  if (!this.chartContainer || !this.evolucion.length || !Highcharts) {
    console.warn('No se puede crear el gráfico');
    return;
  }

  const fechas = this.evolucion.map(item => {
    const fecha = new Date(item.fecha);
    return `${fecha.getDate()}/${fecha.getMonth() + 1}`;
  });
  
  const precisiones = this.evolucion.map(item => item.precision);

  this.chart = Highcharts.chart(this.chartContainer.nativeElement, {
    chart: {
      type: 'column',
      options3d: {
        enabled: true,
        alpha: 20,
        beta: 25,
        depth: 50,
        viewDistance: 25
      },
      backgroundColor: '#ffffff',
      borderRadius: 12,
      // Esto permite la interacción con el mouse para rotar
      events: {
        load: function(this: any) {
          // Agregar evento para rotar con el mouse
          const chart = this;
          let startX = 0;
          let startY = 0;
          let startBeta = 0;
          let startAlpha = 0;
          let isDragging = false;
          
          const container = chart.container;
          
          container.style.cursor = 'grab';
          
          container.addEventListener('mousedown', (e: MouseEvent) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startBeta = chart.options.chart.options3d.beta;
            startAlpha = chart.options.chart.options3d.alpha;
            container.style.cursor = 'grabbing';
            e.preventDefault();
          });
          
          window.addEventListener('mousemove', (e: MouseEvent) => {
            if (isDragging) {
              const deltaX = e.clientX - startX;
              const deltaY = e.clientY - startY;
              
              let newBeta = startBeta + deltaX * 0.5;
              let newAlpha = startAlpha - deltaY * 0.5;
              
              // Limitar ángulos
              newAlpha = Math.max(5, Math.min(60, newAlpha));
              
              chart.update({
                chart: {
                  options3d: {
                    alpha: newAlpha,
                    beta: newBeta
                  }
                }
              });
            }
          });
          
          window.addEventListener('mouseup', () => {
            isDragging = false;
            container.style.cursor = 'grab';
          });
        }
      }
    },
    title: {
      text: undefined
    },
    xAxis: {
      categories: fechas,
      labels: {
        rotation: -45,
        style: { fontSize: '11px' }
      },
      title: { text: 'Fecha' }
    },
    yAxis: {
      title: { text: 'Precisión (%)' },
      min: 0,
      max: 100
    },
    tooltip: {
      headerFormat: '<b>{point.x}</b><br/>',
      pointFormat: 'Precisión: <b>{point.y}%</b>'
    },
    plotOptions: {
      column: {
        depth: 40,
        dataLabels: {
          enabled: true,
          format: '{point.y}%',
          style: { fontWeight: 'bold', fontSize: '11px' }
        }
      }
    },
    series: [{
      name: 'Precisión',
      type: 'column',
      data: precisiones.map((value) => ({
        y: value,
        color: this.obtenerColorPrecision(value)
      }))
    }],
    credits: { enabled: false }
  });
  
  console.log('Gráfico 3D creado - Haz clic y arrastra para rotar');
}
}