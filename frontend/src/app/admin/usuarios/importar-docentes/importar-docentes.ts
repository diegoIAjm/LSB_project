import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../services/usuarios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-importar-docentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importar-docentes.html',
  styleUrls: ['./importar-docentes.css']
})
export class ImportarDocentesComponent {
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';
  
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';
  
  mostrarResultados: boolean = false;
  resultados: any = {
    total: 0,
    creados: 0,
    errores: [],
    detalle: []
  };

  ejemploExcel = [
    ['Carlos', 'López', 'carlos@email.com', '11223344', 'Matemáticas'],
    ['Ana', 'Martínez', 'ana@email.com', '44332211', 'Inglés'],
    ['Luis', 'Rodríguez', 'luis@email.com', '55667788', 'Física']
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

  importarDocentes() {
    if (!this.archivoSeleccionado) {
      this.mensajeError = 'Por favor, seleccione un archivo Excel';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.usuariosService.importarDocentes(this.archivoSeleccionado).subscribe({
      next: (res: any) => {
        this.cargando = false;
        this.resultados = res;
        this.mostrarResultados = true;
        
        if (res.creados > 0 && res.errores.length === 0) {
          this.mensajeExito = `✅ ${res.creados} docentes importados correctamente`;
        } else if (res.creados > 0 && res.errores.length > 0) {
          this.mensajeExito = `⚠️ ${res.creados} docentes importados, ${res.errores.length} errores encontrados`;
        } else {
          this.mensajeError = `❌ No se pudo importar ningún docente. ${res.errores.length} errores encontrados.`;
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
          this.mensajeError = 'Error al importar docentes. Intente nuevamente.';
        }
        this.cd.detectChanges();
      }
    });
  }
}