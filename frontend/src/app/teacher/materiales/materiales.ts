import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialesService, Material, NuevoMaterial, MaterialesResponse } from '../../services/materiales.service';
import { CursosService } from '../../services/cursos.service';

@Component({
  selector: 'app-materiales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materiales.html',
  styleUrls: ['./materiales.css']
})
export class MaterialesComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  cursoId: number = 0;
  cursoNombre: string = '';
  materiales: Material[] = [];
  lecciones: any[] = [];
  cargando = true;
  mostrarModal = false;
  
  archivoSeleccionado: File | null = null;
  
  nuevoMaterial = {
    titulo: '',
    tipo: '',
    archivo_url: '',
    leccion_id: null as number | null
  };
  
  tipos = [
    { value: 'pdf', label: '📄 PDF' },
    { value: 'video', label: '🎥 Video' },
    { value: 'imagen', label: '🖼️ Imagen' },
    { value: 'documento', label: '📝 Documento' }
  ];
  
  mensaje = '';
  error = '';
  cargandoForm = false;

  constructor(
    private cursosService: CursosService,
    private materialesService: MaterialesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cursoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarCurso();
    this.cargarMateriales();
    this.cargarLecciones();
  }

  cargarCurso(): void {
    this.cursosService.getCurso(this.cursoId).subscribe({
      next: (curso: any) => {
        this.cursoNombre = curso.nombre;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error(err)
    });
  }

  cargarMateriales(): void {
    this.cargando = true;
    this.materialesService.getMateriales(this.cursoId).subscribe({
      next: (response: MaterialesResponse) => {
        console.log('📦 Materiales recibidos:', response);
        this.materiales = response.materiales;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  cargarLecciones(): void {
    this.cursosService.getLeccionesDuolingo().subscribe({
      next: (lecciones: any[]) => {
        this.lecciones = lecciones;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.lecciones = [];
      }
    });
  }

  volver(): void {
    this.router.navigate(['/teacher/mis-cursos']);
  }

  abrirModalSubir(): void {
    this.mostrarModal = true;
    this.nuevoMaterial = {
      titulo: '',
      tipo: '',
      archivo_url: '',
      leccion_id: null
    };
    this.archivoSeleccionado = null;
    this.error = '';
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.archivoSeleccionado = files[0];
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.archivoSeleccionado = files[0];
    }
  }

  removerArchivo(event: Event): void {
    event.stopPropagation();
    this.archivoSeleccionado = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  guardarMaterial(): void {
    if (!this.nuevoMaterial.titulo || !this.nuevoMaterial.tipo) {
      this.error = 'Título y tipo son obligatorios';
      return;
    }
    
    if (!this.archivoSeleccionado && !this.nuevoMaterial.archivo_url) {
      this.error = 'Debes subir un archivo o proporcionar una URL';
      return;
    }
    
    this.cargandoForm = true;
    this.error = '';
    
    const formData = new FormData();
    formData.append('titulo', this.nuevoMaterial.titulo);
    formData.append('tipo', this.nuevoMaterial.tipo);
    formData.append('curso', this.cursoId.toString());
    if (this.nuevoMaterial.leccion_id) {
      formData.append('leccion_id', this.nuevoMaterial.leccion_id.toString());
    }
    if (this.archivoSeleccionado) {
      formData.append('archivo', this.archivoSeleccionado);
    }
    if (this.nuevoMaterial.archivo_url) {
      formData.append('archivo_url', this.nuevoMaterial.archivo_url);
    }
    
    this.materialesService.crearMaterial(formData).subscribe({
      next: () => {
        this.mensaje = 'Material subido correctamente';
        this.cerrarModal();
        this.cargarMateriales();
        this.cargandoForm = false;
        setTimeout(() => this.mensaje = '', 3000);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.error = err.error?.mensaje || 'Error al subir material';
        this.cargandoForm = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarMaterial(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar este material?')) return;
    
    this.materialesService.eliminarMaterial(id).subscribe({
      next: () => {
        this.mensaje = 'Material eliminado correctamente';
        this.cargarMateriales();
        setTimeout(() => this.mensaje = '', 3000);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = 'Error al eliminar material';
        setTimeout(() => this.error = '', 3000);
        this.cdr.detectChanges();
      }
    });
  }

  getTipoIcono(tipo: string): string {
    const iconos: Record<string, string> = {
      'pdf': '📄', 'video': '🎥', 'imagen': '🖼️', 'documento': '📝'
    };
    return iconos[tipo] || '📎';
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'pdf': 'PDF', 'video': 'Video', 'imagen': 'Imagen', 'documento': 'Documento'
    };
    return labels[tipo] || tipo;
  }

abrirArchivo(material: Material): void {
  let url = material.archivo || material.archivo_url;
  
  if (!url) {
    this.error = 'No se encontró el archivo';
    return;
  }
  
  // Limpiar la URL: quitar '/materiales/' si existe
  url = url.replace('/materiales/', '/');
  
  // Agregar dominio si es necesario
  if (url.startsWith('/media/')) {
    url = `http://127.0.0.1:8000${url}`;
  }
  
  window.open(url, '_blank');
}

descargarArchivo(material: Material): void {
  let url = material.archivo || material.archivo_url;
  
  if (!url) {
    this.error = 'No se encontró el archivo';
    return;
  }
  
  url = url.replace('/materiales/', '/');
  
  if (url.startsWith('/media/')) {
    url = `http://127.0.0.1:8000${url}`;
  }
  
  const link = document.createElement('a');
  link.href = url;
  link.download = material.titulo || 'archivo';
  link.click();
}
  
  // 🔹 VERIFICAR SI ES PDF PARA MOSTRAR EN MODAL
  esPdf(material: Material): boolean {
    return material.archivo_url?.toLowerCase().endsWith('.pdf') || 
           material.tipo === 'pdf';
  }
}