// src/app/teacher/estadisticas-estudiante/estadisticas-estudiante.ts

import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluacionesService, EntregaDocente } from '../../services/evaluaciones.service';
import * as Highcharts from 'highcharts';
import HC_3D from 'highcharts/highcharts-3d';
import * as echarts from 'echarts';

// Inicializar módulo 3D de Highcharts
HC_3D(Highcharts);

@Component({
  selector: 'app-estadisticas-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas-estudiante.html',
  styleUrls: ['./estadisticas-estudiante.css']
})
export class EstadisticasEstudianteComponent implements OnInit, AfterViewInit {
  @ViewChild('chartEvolucion') chartEvolucion!: ElementRef;
  @ViewChild('chartNotas') chartNotas!: ElementRef;
  @ViewChild('chart3d') chart3d!: ElementRef;
  @ViewChild('chartRadar') chartRadar!: ElementRef;
  @ViewChild('chart3dRadar') chart3dRadar!: ElementRef;

  senasRequeridas: any[] = [];
  private apiUrl = 'http://localhost:8000/api'; 
  
  estudianteId: number = 0;
  estudianteNombre: string = '';
  cursoId: number = 0;
  cursoNombre: string = '';
  
  entregas: EntregaDocente[] = [];
  cargando = true;
  
  // Estadísticas resumen
  promedioNotas: number = 0;
  promedioPrecision: number = 0;
  totalIntentos: number = 0;
  mejorNota: number = 0;
  peorNota: number = 0;
  practicasCompletadas: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionService: EvaluacionesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.estudianteId = Number(this.route.snapshot.paramMap.get('id'));
    this.cursoId = Number(this.route.snapshot.queryParams['cursoId']);
    this.cursoNombre = this.route.snapshot.queryParams['cursoNombre'] || '';
    this.estudianteNombre = this.route.snapshot.queryParams['estudianteNombre'] || '';
    
    console.log('Parámetros recibidos:', {
      estudianteId: this.estudianteId,
      cursoId: this.cursoId,
      estudianteNombre: this.estudianteNombre,
      cursoNombre: this.cursoNombre
    });
    
    if (this.estudianteId && this.cursoId) {
      this.cargarEntregas();
      this.cargarSenasDelCurso();
    } else {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.entregas.length > 0 && !this.cargando) {
        this.crearGraficos();
      }
    }, 500);
  }

  cargarEntregas(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    
    console.log('Cargando entregas para curso:', this.cursoId);
    
    this.evaluacionService.getEntregasPorCurso(this.cursoId).subscribe({
      next: (data: EntregaDocente[]) => {
        console.log('Entregas recibidas:', data);
        this.entregas = data.filter(e => e.estudiante_id === this.estudianteId);
        console.log('Entregas del estudiante:', this.entregas);
        
        this.calcularEstadisticas();
        this.cargando = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          if (this.entregas.length > 0) {
            this.crearGraficos();
          }
        }, 300);
      },
      error: (error) => {
        console.error('Error cargando entregas:', error);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularEstadisticas(): void {
    const completadas = this.entregas.filter(e => e.nota_final !== null && e.nota_final !== undefined);
    const notas = completadas.map(e => typeof e.nota_final === 'string' ? parseFloat(e.nota_final) : (e.nota_final as number));
    const precisiones = completadas.filter(e => e.resumen?.precision_promedio).map(e => e.resumen?.precision_promedio as number);
    
    this.practicasCompletadas = completadas.length;
    this.promedioNotas = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    this.promedioPrecision = precisiones.length > 0 ? precisiones.reduce((a, b) => a + b, 0) / precisiones.length : 0;
    this.totalIntentos = this.entregas.reduce((sum, e) => sum + (e.intentos || 0), 0);
    this.mejorNota = notas.length > 0 ? Math.max(...notas) : 0;
    this.peorNota = notas.length > 0 ? Math.min(...notas) : 0;
    
    console.log('Estadísticas calculadas:', {
      practicasCompletadas: this.practicasCompletadas,
      promedioNotas: this.promedioNotas,
      promedioPrecision: this.promedioPrecision,
      totalIntentos: this.totalIntentos,
      mejorNota: this.mejorNota,
      peorNota: this.peorNota
    });
    
    this.cdr.detectChanges();
  }

  crearGraficos(): void {
    console.log('Creando gráficos...');
    
    if (this.entregas.length === 0) {
      console.log('No hay entregas para mostrar gráficos');
      return;
    }
    
    this.crearGraficoEvolucion();
    this.crearGrafico3D();
    this.crearGraficoRadar();
    this.crearGrafico3DRadar();
    
    this.cdr.detectChanges();
  }

  crearGraficoEvolucion(): void {
    if (!this.chartEvolucion || !this.chartEvolucion.nativeElement) {
      console.warn('chartEvolucion no disponible');
      return;
    }
    
    const ordenadas = [...this.entregas].sort((a, b) => 
      new Date(a.fecha_entrega || a.fecha_inicio).getTime() - 
      new Date(b.fecha_entrega || b.fecha_inicio).getTime()
    );
    
    const fechas = ordenadas.map(e => {
      const fecha = new Date(e.fecha_entrega || e.fecha_inicio);
      return `${fecha.getDate()}/${fecha.getMonth() + 1}`;
    });
    
    const notas = ordenadas.map(e => {
      if (e.nota_final !== null && e.nota_final !== undefined) {
        return typeof e.nota_final === 'string' ? parseFloat(e.nota_final) : e.nota_final;
      }
      return 0;
    });
    
    const tooltipData = ordenadas.map(e => ({
      estado: e.estado,
      titulo: e.evaluacion_titulo
    }));
    
    Highcharts.chart(this.chartEvolucion.nativeElement, {
      chart: {
        type: 'line',
        backgroundColor: 'transparent',
        borderRadius: 12
      },
      title: { text: 'Evolución de notas' },
      xAxis: { categories: fechas, title: { text: 'Fecha' } },
      yAxis: { title: { text: 'Nota' }, min: 0, max: 20 },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: 'Práctica: <b>{point.titulo}</b><br/>Nota: <b>{point.y}/20</b><br/>Estado: <b>{point.estado}</b>'
      },
      plotOptions: { line: { marker: { enabled: true, radius: 5 } } },
      series: [{
        name: 'Nota',
        type: 'line',
        data: notas.map((nota, index) => ({
          y: nota,
          estado: tooltipData[index].estado,
          titulo: tooltipData[index].titulo
        })),
        lineWidth: 3,
        lineColor: '#3b82f6',
        marker: { radius: 5, fillColor: '#3b82f6' }
      }],
      credits: { enabled: false }
    } as any);
  }

  crearGrafico3D(): void {
    if (!this.chart3d || !this.chart3d.nativeElement) {
      console.warn('chart3d no disponible');
      return;
    }
    
    const ordenadas = [...this.entregas].sort((a, b) => 
      new Date(a.fecha_entrega || a.fecha_inicio).getTime() - 
      new Date(b.fecha_entrega || b.fecha_inicio).getTime()
    );
    
    const nombres = ordenadas.map(e => e.evaluacion_titulo?.substring(0, 15) || 'Práctica');
    const notas = ordenadas.map(e => e.nota_final || 0);
    const precisiones = ordenadas.map(e => e.resumen?.precision_promedio || 0);
    
    try {
      Highcharts.chart(this.chart3d.nativeElement, {
        chart: {
          type: 'column',
          options3d: { enabled: true, alpha: 15, beta: 25, depth: 50, viewDistance: 25 },
          backgroundColor: 'transparent',
          borderRadius: 12
        },
        title: { text: 'Comparativa 3D: Notas vs Precisión' },
        xAxis: { categories: nombres, labels: { rotation: -45, style: { fontSize: '10px' } } },
        yAxis: { title: { text: 'Valor' }, min: 0, max: 100 },
        tooltip: { headerFormat: '<b>{point.x}</b><br/>', pointFormat: '{series.name}: {point.y}' },
        plotOptions: { column: { depth: 40, dataLabels: { enabled: true } } },
        series: [
          { name: 'Nota (escala 0-20 → 0-100)', type: 'column', data: notas.map(n => n * 5) },
          { name: 'Precisión (%)', type: 'column', data: precisiones }
        ],
        credits: { enabled: false }
      } as any);
      console.log('Gráfico 3D creado');
    } catch (error) {
      console.error('Error creando gráfico 3D:', error);
    }
  }

  cargarSenasDelCurso(): void {
    this.evaluacionService.getSenasPorCurso(this.cursoId).subscribe({
      next: (senas: any[]) => {
        this.senasRequeridas = senas;
        console.log('Señas del curso:', this.senasRequeridas);
        if (this.entregas.length > 0) {
          this.crearGraficoRadar();
        }
      },
      error: (error) => {
        console.error('Error cargando señas del curso:', error);
      }
    });
  }

  crearGraficoRadar(): void {
    if (!this.chartRadar || !this.chartRadar.nativeElement) {
      console.warn('chartRadar no disponible');
      return;
    }
    
    const precisionPorSena = new Map<string, { suma: number; count: number }>();
    
    this.entregas.forEach(entrega => {
      if (entrega.videos && entrega.videos.length > 0) {
        entrega.videos.forEach(video => {
          const nombreSena = video.sena_nombre;
          let precision = video.resultado?.precision || 0;
          
          if (typeof precision === 'string') precision = parseFloat(precision);
          if (isNaN(precision)) precision = 0;
          
          if (!precisionPorSena.has(nombreSena)) {
            precisionPorSena.set(nombreSena, { suma: 0, count: 0 });
          }
          const data = precisionPorSena.get(nombreSena)!;
          data.suma += precision;
          data.count++;
        });
      }
    });
    
    const todasSenas = Array.from(precisionPorSena.keys()).sort();
    const precisionesPromedio = todasSenas.map(sena => {
      const data = precisionPorSena.get(sena)!;
      if (data.count === 0) return 0;
      return parseFloat((data.suma / data.count).toFixed(2));
    });
    
    console.log('Todas las señas encontradas:', todasSenas);
    console.log('Precisiones promedio:', precisionesPromedio);
    
    if (todasSenas.length === 0) {
      const chartContainer = this.chartRadar.nativeElement;
      chartContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">No hay datos de precisión disponibles</div>';
      return;
    }
    
    try {
      if (this.chartRadar.nativeElement.hasChildNodes()) {
        while (this.chartRadar.nativeElement.firstChild) {
          this.chartRadar.nativeElement.removeChild(this.chartRadar.nativeElement.firstChild);
        }
      }
      
      Highcharts.chart(this.chartRadar.nativeElement, {
        chart: { polar: true, type: 'line', backgroundColor: 'transparent', borderRadius: 12 },
        title: { text: 'Precisión por tipo de seña' },
        xAxis: { categories: todasSenas, tickmarkPlacement: 'on', lineWidth: 0 },
        yAxis: { gridLineInterpolation: 'polygon', lineWidth: 0, min: 0, max: 100, title: { text: 'Precisión (%)' }, labels: { format: '{value}%' } },
        tooltip: { pointFormat: '{series.name}: <b>{point.y:.1f}%</b>' },
        plotOptions: { series: { marker: { enabled: true, radius: 6 } } },
        series: [{
          name: 'Precisión promedio',
          type: 'line',
          data: precisionesPromedio,
          pointPlacement: 'on',
          lineWidth: 3,
          lineColor: '#10b981',
          fillColor: 'rgba(16, 185, 129, 0.1)',
          marker: { fillColor: '#10b981', radius: 6 }
        }],
        credits: { enabled: false }
      } as any);
      console.log('Gráfico radar creado correctamente con', todasSenas.length, 'señas');
    } catch (error) {
      console.error('Error creando gráfico radar:', error);
    }
  }

  // ✅ Gráfico 3D interactivo con ECharts
  crearGrafico3DRadar(): void {
    if (!this.chart3dRadar || !this.chart3dRadar.nativeElement) {
      console.warn('chart3dRadar no disponible');
      return;
    }
    
    // Construir datos para el gráfico 3D
    const precisionPorSena = new Map<string, { suma: number; count: number }>();
    
    this.entregas.forEach(entrega => {
      if (entrega.videos && entrega.videos.length > 0) {
        entrega.videos.forEach(video => {
          const nombreSena = video.sena_nombre;
          let precision = video.resultado?.precision || 0;
          
          if (typeof precision === 'string') precision = parseFloat(precision);
          if (isNaN(precision)) precision = 0;
          
          if (!precisionPorSena.has(nombreSena)) {
            precisionPorSena.set(nombreSena, { suma: 0, count: 0 });
          }
          const data = precisionPorSena.get(nombreSena)!;
          data.suma += precision;
          data.count++;
        });
      }
    });
    
    const todasSenas = Array.from(precisionPorSena.keys()).sort();
    const precisionesPromedio = todasSenas.map(sena => {
      const data = precisionPorSena.get(sena)!;
      if (data.count === 0) return 0;
      return parseFloat((data.suma / data.count).toFixed(2));
    });
    
    if (todasSenas.length === 0) {
      console.log('No hay datos para el gráfico 3D');
      return;
    }
    
    // Datos para gráfico 3D de barras
    const data3D = todasSenas.map((sena, index) => {
      return [index, precisionesPromedio[index], 0];
    });
    
    // Limpiar contenedor
    if (this.chart3dRadar.nativeElement.hasChildNodes()) {
      while (this.chart3dRadar.nativeElement.firstChild) {
        this.chart3dRadar.nativeElement.removeChild(this.chart3dRadar.nativeElement.firstChild);
      }
    }
    
    const chart = echarts.init(this.chart3dRadar.nativeElement);
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.data) {
            return `${todasSenas[params.data[0]]}<br/>Precisión: ${params.data[1]}%`;
          }
          return '';
        }
      },
      xAxis3D: {
        name: 'Seña',
        type: 'category',
        data: todasSenas,
        axisLabel: {
          rotate: 45,
          interval: 0,
          fontSize: 11
        }
      },
      yAxis3D: {
        name: 'Precisión (%)',
        type: 'value',
        min: 0,
        max: 100
      },
      zAxis3D: {
        name: '',
        show: false
      },
      grid3D: {
        viewControl: {
          autoRotate: true,
          autoRotateSpeed: 5,
          distance: 200,
          alpha: 30,
          beta: 40,
          zoomSensitivity: 1,
          rotateSensitivity: 1
        },
        boxWidth: 60,
        boxHeight: 80,
        boxDepth: 20,
        light: {
          main: { intensity: 1.2, shadow: true },
          ambient: { intensity: 0.6 }
        }
      },
      series: [{
        name: 'Precisión',
        type: 'bar3D',
        data: data3D,
        shading: 'realistic',
        barSize: 0.6,
        label: {
          show: true,
          formatter: (params: any) => `${params.data[1]}%`,
          position: 'top',
          distance: 5,
          fontSize: 11,
          fontWeight: 'bold'
        },
        itemStyle: {
          color: (params: any) => {
            const value = params.data[1];
            if (value >= 70) return '#48bb78';
            if (value >= 40) return '#ed8936';
            return '#f56565';
          },
          opacity: 0.85,
          borderWidth: 1,
          borderColor: '#ffffff'
        },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' },
          itemStyle: { opacity: 1, borderWidth: 2 }
        }
      }],
      backgroundColor: 'transparent'
    };
    
    chart.setOption(option);
    
    // Manejar redimensionamiento
    window.addEventListener('resize', () => {
      chart.resize();
    });
    
    console.log('Gráfico 3D interactivo creado con', todasSenas.length, 'barras');
  }

  volver(): void {
    this.router.navigate(['/teacher/estudiante-practicas', this.estudianteId], {
      queryParams: {
        cursoId: this.cursoId,
        cursoNombre: this.cursoNombre,
        estudianteNombre: this.estudianteNombre
      }
    });
  }
}