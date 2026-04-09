import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({
  selector: 'app-diccionario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diccionario.html',
  styleUrls: ['./diccionario.css']
})
export class DiccionarioComponent implements OnInit, AfterViewInit {
  @ViewChild('avatarContainer') avatarContainer!: ElementRef;
  
  // Palabras del diccionario
  palabras = [
    { id: 1, termino: 'Hola', significado: 'Saludo inicial', categoria: 'Saludos' },
    { id: 2, termino: 'Gracias', significado: 'Expresar agradecimiento', categoria: 'Cortesía' },
    { id: 3, termino: 'Por favor', significado: 'Solicitar algo educadamente', categoria: 'Cortesía' },
    { id: 4, termino: 'Amigo', significado: 'Persona con la que hay amistad', categoria: 'Relaciones' },
    { id: 5, termino: 'Familia', significado: 'Conjunto de parientes', categoria: 'Relaciones' },
    { id: 6, termino: 'Escuela', significado: 'Lugar de estudio', categoria: 'Lugares' },
    { id: 7, termino: 'Profesor', significado: 'Persona que enseña', categoria: 'Profesiones' },
    { id: 8, termino: 'Estudiante', significado: 'Persona que aprende', categoria: 'Profesiones' }
  ];
  
  terminoBusqueda = '';
  categoriaSeleccionada = '';
  palabrasFiltradas: any[] = [];
  palabraSeleccionada: any = null;
  
  categorias = ['Todos', 'Saludos', 'Cortesía', 'Relaciones', 'Lugares', 'Profesiones'];
  
  // Variables para Three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private model: any;
  private animationId: number | null = null;

  constructor() {}

  ngOnInit(): void {
    this.palabrasFiltradas = [...this.palabras];
  }

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.loadAvatar();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJS(): void {
    const container = this.avatarContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02);
    
    // Cámara
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2, 1.5, 3);
    this.camera.lookAt(0, 1, 0);
    
    // Renderizador
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    
    // Controles de órbita
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.5;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.target.set(0, 1, 0);
    
    // Luces
    this.setupLights();
    
    // Suelo decorativo
    this.setupFloor();
    
    // Partículas de fondo
    this.setupParticles();
    
    // Animación
    this.animate();
    
    // Ajustar al redimensionar ventana
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupLights(): void {
    // Luz ambiental
    const ambientLight = new THREE.AmbientLight(0x404060);
    this.scene.add(ambientLight);
    
    // Luz principal direccional
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(2, 5, 3);
    mainLight.castShadow = true;
    mainLight.receiveShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    this.scene.add(mainLight);
    
    // Luz de relleno
    const fillLight = new THREE.PointLight(0x4466cc, 0.5);
    fillLight.position.set(1, 2, 2);
    this.scene.add(fillLight);
    
    // Luz de contra
    const backLight = new THREE.PointLight(0xffaa66, 0.3);
    backLight.position.set(0, 2, -2);
    this.scene.add(backLight);
    
    // Luz de acento desde abajo
    const rimLight = new THREE.PointLight(0x88aaff, 0.4);
    rimLight.position.set(0, -1, 0);
    this.scene.add(rimLight);
  }

  private setupFloor(): void {
    // Plano de suelo semi-transparente
    const planeGeometry = new THREE.CircleGeometry(3, 32);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0.5 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.6;
    plane.receiveShadow = true;
    this.scene.add(plane);
    
    // Grid helper decorativo
    const gridHelper = new THREE.GridHelper(6, 20, 0x6688ff, 0x3355aa);
    gridHelper.position.y = -0.55;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    this.scene.add(gridHelper);
  }

  private setupParticles(): void {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 20;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 5;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.03,
      color: 0x88aaff,
      transparent: true,
      opacity: 0.5
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(particlesMesh);
  }

private loadAvatar(): void {
  const loader = new GLTFLoader();
  const modelPath = '/assets/models/ModeloLSB.glb';
  
  loader.load(modelPath, 
    (gltf) => {
      this.model = gltf.scene;
      
      // Calcular tamaño actual
      const box = new THREE.Box3().setFromObject(this.model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Escalar para que el modelo tenga aproximadamente 1.5 unidades de altura
      const targetHeight = 1.5;
      const escala = targetHeight / maxDim;
      
      console.log(`📏 Escalando de ${maxDim} a ${targetHeight} (factor: ${escala})`);
      
      this.model.scale.set(escala, escala, escala);
      this.model.position.set(0, 0, 0);
      
      this.scene.add(this.model);
      
      // Ajustar cámara
      this.camera.position.set(2, 1.5, 3);
      this.controls.target.set(0, 0.75, 0);
      this.controls.update();
    },
    undefined,
    (error) => console.error('Error:', error)
  );
}

private ajustarCamara(): void {
  if (!this.model) return;
  
  // Calcular el bounding box del modelo
  const box = new THREE.Box3().setFromObject(this.model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  
  // Calcular distancia para que el modelo quepa en la vista
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = maxDim * 1.5;
  
  // Ajustar cámara
  this.camera.position.set(distance * 0.8, distance * 0.6, distance);
  this.controls.target.copy(center);
  this.camera.lookAt(center);
  this.controls.update();
  
  console.log('🎥 Cámara ajustada a:', this.camera.position);
}


  private animate(): void {
    const animateLoop = () => {
      this.animationId = requestAnimationFrame(animateLoop);
      
      if (this.controls) {
        this.controls.update(); // Actualiza la cámara si el usuario interactúa
      }
      
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    
    animateLoop();
  }

  private onWindowResize(): void {
    const container = this.avatarContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Métodos del diccionario
  filtrarPalabras(): void {
    let filtradas = [...this.palabras];
    
    if (this.terminoBusqueda) {
      filtradas = filtradas.filter(p => 
        p.termino.toLowerCase().includes(this.terminoBusqueda.toLowerCase())
      );
    }
    
    if (this.categoriaSeleccionada && this.categoriaSeleccionada !== 'Todos') {
      filtradas = filtradas.filter(p => p.categoria === this.categoriaSeleccionada);
    }
    
    this.palabrasFiltradas = filtradas;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.categoriaSeleccionada = '';
    this.palabrasFiltradas = [...this.palabras];
  }

  seleccionarPalabra(palabra: any): void {
    this.palabraSeleccionada = palabra;
    
    // Efecto visual: rotación suave del avatar
    if (this.controls) {
      this.controls.autoRotate = false;
      setTimeout(() => {
        if (this.controls) this.controls.autoRotate = true;
      }, 3000);
    }
  }

  cerrarModal(): void {
    this.palabraSeleccionada = null;
  }


  private createSimpleAvatar(): void {
  const group = new THREE.Group();
  
  // Cuerpo
  const bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 32);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a90d9, roughness: 0.3, metalness: 0.1 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  body.position.y = 0;
  group.add(body);
  
  // Cabeza
  const headGeo = new THREE.SphereGeometry(0.4, 32, 32);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.2 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.castShadow = true;
  head.receiveShadow = true;
  head.position.y = 0.65;
  group.add(head);
  
  // Ojos
  const eyeGeo = new THREE.SphereGeometry(0.08, 32, 32);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.15, 0.75, 0.4);
  leftEye.castShadow = true;
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.15, 0.75, 0.4);
  rightEye.castShadow = true;
  group.add(rightEye);
  
  // Pupilas
  const pupilGeo = new THREE.SphereGeometry(0.04, 32, 32);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(-0.15, 0.73, 0.48);
  group.add(leftPupil);
  
  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(0.15, 0.73, 0.48);
  group.add(rightPupil);
  
  // Nariz
  const noseGeo = new THREE.ConeGeometry(0.08, 0.1, 32);
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xffaa88 });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, 0.6, 0.45);
  group.add(nose);
  
  group.position.y = -0.5;
  group.castShadow = true;
  group.receiveShadow = true;
  
  this.model = group;
  this.scene.add(this.model);
}
}


