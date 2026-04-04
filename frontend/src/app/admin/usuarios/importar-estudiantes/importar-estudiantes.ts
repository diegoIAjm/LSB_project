import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../services/usuarios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-importar-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importar-estudiantes.html',
  styleUrls: ['./importar-estudiantes.css']
})
export class ImportarEstudiantesComponent {
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';
  
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';
  
  // Resultados de importación
  mostrarResultados: boolean = false;
  resultados: any = {
    total: 0,
    creados: 0,
    errores: [],
    detalle: []
  };

  // Ejemplo de Excel para estudiantes
  ejemploExcel = [
    ['Juan', 'Pérez', 'juan@email.com', '12345678', 'Principiante'],
    ['María', 'García', 'maria@email.com', '87654321', 'Intermedio'],
    ['Carlos', 'López', 'carlos@email.com', '11223344', 'Avanzado']
  ];

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  volverUsuarios() {
    this.router.navigate(['/admin/usuarios']);
  }

  onArchivoSeleccionado(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      const extension = archivo.name.split('.').pop().toLowerCase();
      if (extension === 'xlsx' || extension === 'xls') {
        this.archivoSeleccionado = archivo;
        this.nombreArchivo = archivo.name;
        this.mensajeError = '';
        this.limpiarResultados();
      } else {
        this.mensajeError = 'Formato no válido. Use archivos .xlsx o .xls';
        this.archivoSeleccionado = null;
        this.nombreArchivo = '';
      }
    }
  }

  limpiarArchivo() {
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.mensajeError = '';
    this.limpiarResultados();
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  limpiarResultados() {
    this.mostrarResultados = false;
    this.resultados = {
      total: 0,
      creados: 0,
      errores: [],
      detalle: []
    };
  }

  importarEstudiantes() {
    if (!this.archivoSeleccionado) {
      this.mensajeError = 'Por favor, seleccione un archivo Excel';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.usuariosService.importarEstudiantes(this.archivoSeleccionado).subscribe({
      next: (res: any) => {
        this.cargando = false;
        this.resultados = res;
        this.mostrarResultados = true;
        
        if (res.creados > 0 && res.errores.length === 0) {
          this.mensajeExito = `✅ ${res.creados} estudiantes importados correctamente`;
        } else if (res.creados > 0 && res.errores.length > 0) {
          this.mensajeExito = `⚠️ ${res.creados} estudiantes importados, ${res.errores.length} errores encontrados`;
        } else {
          this.mensajeError = `❌ No se pudo importar ningún estudiante. ${res.errores.length} errores encontrados.`;
        }
        
        this.cd.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        if (err.error?.error) {
          this.mensajeError = err.error.error;
        } else if (err.error?.errores) {
          this.resultados = err.error;
          this.mostrarResultados = true;
          this.mensajeError = `❌ ${err.error.errores.length} errores encontrados`;
        } else {
          this.mensajeError = 'Error al importar estudiantes. Intente nuevamente.';
        }
        this.cd.detectChanges();
      }
    });
  }
}