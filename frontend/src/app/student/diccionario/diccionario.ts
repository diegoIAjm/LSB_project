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
  
  palabras = [
    { id: 1, termino: 'Hola', significado: 'Saludo inicial', categoria: 'Saludos', keypointsFile: 'Hola_1776886075492' },
    { id: 2, termino: 'Gracias', significado: 'Expresar agradecimiento', categoria: 'Cortesía', keypointsFile: 'gracias' },
    { id: 3, termino: 'Por favor', significado: 'Solicitar algo educadamente', categoria: 'Cortesía', keypointsFile: 'por_favor' },
    { id: 4, termino: 'Amigo', significado: 'Persona con la que hay amistad', categoria: 'Relaciones', keypointsFile: 'amigo' },
    { id: 5, termino: 'Familia', significado: 'Conjunto de parientes', categoria: 'Relaciones', keypointsFile: 'familia' },
    { id: 6, termino: 'Escuela', significado: 'Lugar de estudio', categoria: 'Lugares', keypointsFile: 'escuela' },
    { id: 7, termino: 'Profesor', significado: 'Persona que enseña', categoria: 'Profesiones', keypointsFile: 'profesor' },
    { id: 8, termino: 'Estudiante', significado: 'Persona que aprende', categoria: 'Profesiones', keypointsFile: 'estudiante' }
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
  
  // Mapa de huesos
  private boneMap: Map<string, any> = new Map();
  
  // Variables para animación de keypoints
  private keypointsActuales: any[] = [];
  private frameActual: number = 0;
  private animandoSena: boolean = false;
  private intervaloAnimacion: any = null;

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
    if (this.intervaloAnimacion) {
      clearInterval(this.intervaloAnimacion);
    }
  }

  private initThreeJS(): void {
    const container = this.avatarContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02);
    
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2, 1.5, 3);
    this.camera.lookAt(0, 1, 0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.5;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.target.set(0, 1, 0);
    
    this.setupLights();
    this.setupFloor();
    this.setupParticles();
    
    this.animate();
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404060);
    this.scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(2, 5, 3);
    mainLight.castShadow = true;
    this.scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x4466cc, 0.5);
    fillLight.position.set(1, 2, 2);
    this.scene.add(fillLight);
    
    const backLight = new THREE.PointLight(0xffaa66, 0.3);
    backLight.position.set(0, 2, -2);
    this.scene.add(backLight);
    
    const rimLight = new THREE.PointLight(0x88aaff, 0.4);
    rimLight.position.set(0, -1, 0);
    this.scene.add(rimLight);
  }

  private setupFloor(): void {
    const planeGeometry = new THREE.CircleGeometry(3, 32);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0.5 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.6;
    plane.receiveShadow = true;
    this.scene.add(plane);
    
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
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.03, color: 0x88aaff, transparent: true, opacity: 0.5 });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(particlesMesh);
  }

  private loadAvatar(): void {
    const loader = new GLTFLoader();
    const modelPath = '/assets/models/ModeloLSB.glb';
    
    loader.load(modelPath, 
      (gltf) => {
        this.model = gltf.scene;
        
        // Escalar modelo
        const box = new THREE.Box3().setFromObject(this.model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetHeight = 1.5;
        const escala = targetHeight / maxDim;
        this.model.scale.set(escala, escala, escala);
        this.model.position.set(0, 0, 0);
        
        // Guardar huesos
        this.model.traverse((child: any) => {
          if (child.isBone === true || child.type === 'Bone') {
            this.boneMap.set(child.name, child);
          }
        });
        
        console.log(`✅ ${this.boneMap.size} huesos cargados`);
        
        this.scene.add(this.model);
        
        this.camera.position.set(2, 1.5, 3);
        this.controls.target.set(0, 0.75, 0);
        this.controls.update();
      },
      undefined,
      (error) => console.error('Error:', error)
    );
  }

  private findBone(namePattern: string): any | null {
    for (let [key, bone] of this.boneMap) {
      if (key.toLowerCase().includes(namePattern.toLowerCase())) {
        return bone;
      }
    }
    return null;
  }

  private rotateBone(boneName: string, rotation: THREE.Euler): void {
    const bone = this.findBone(boneName);
    if (bone) {
      bone.rotation.x = rotation.x;
      bone.rotation.y = rotation.y;
      bone.rotation.z = rotation.z;
    }
  }

  private resetPose(): void {
    // Resetear todos los huesos del brazo derecho
    this.rotateBone('mixamorigRightShoulder', new THREE.Euler(0, 0, 0));
    this.rotateBone('mixamorigRightArm', new THREE.Euler(0, 0, 0));
    this.rotateBone('mixamorigRightForeArm', new THREE.Euler(0, 0, 0));
    this.rotateBone('mixamorigRightHand', new THREE.Euler(0, 0, 0));
  }

  async reproducirSena(keypointsFile: string) {
    try {
      console.log(`🎬 Cargando seña: ${keypointsFile}`);
      const response = await fetch(`/assets/keypoints/${keypointsFile}.json`);
      const keypoints = await response.json();
      
      this.keypointsActuales = keypoints;
      this.frameActual = 0;
      this.animandoSena = true;
      
      if (this.intervaloAnimacion) {
        clearInterval(this.intervaloAnimacion);
      }
      
      this.intervaloAnimacion = setInterval(() => {
        this.actualizarPosePorKeypoints();
      }, 50);
      
      setTimeout(() => {
        if (this.intervaloAnimacion) {
          clearInterval(this.intervaloAnimacion);
          this.intervaloAnimacion = null;
          this.animandoSena = false;
          this.resetPose();
        }
      }, keypoints.length * 50 + 500);
      
    } catch (error) {
      console.error('Error cargando keypoints:', error);
    }
  }
  
  private actualizarPosePorKeypoints(): void {
    if (!this.animandoSena || !this.keypointsActuales || this.frameActual >= this.keypointsActuales.length) {
      return;
    }
    
    const frame = this.keypointsActuales[this.frameActual];
    
    if (frame && frame[0] && frame[0][0]) {
      const wrist = frame[0][0];     // Muñeca
      const thumb = frame[0][4];     // Pulgar
      const index = frame[0][8];     // Índice
      
      // Calcular rotaciones
      const rotacionHombro = {
        x: (wrist[1] - 0.5) * 1.5,
        y: (wrist[0] - 0.5) * 1.5,
        z: (thumb[2] - 0.3) * 1
      };
      
      const rotacionCodo = {
        x: (index[1] - wrist[1]) * 2,
        y: (index[0] - wrist[0]) * 2,
        z: 0
      };
      
      const rotacionMano = {
        x: (thumb[1] - wrist[1]) * 1.5,
        y: (thumb[0] - wrist[0]) * 1.5,
        z: 0
      };
      
      // Aplicar rotaciones a los huesos de Mixamo
      this.rotateBone('mixamorigRightShoulder', new THREE.Euler(rotacionHombro.x, rotacionHombro.y, rotacionHombro.z));
      this.rotateBone('mixamorigRightArm', new THREE.Euler(rotacionCodo.x, rotacionCodo.y, rotacionCodo.z));
      this.rotateBone('mixamorigRightForeArm', new THREE.Euler(rotacionCodo.x * 0.7, rotacionCodo.y * 0.5, 0));
      this.rotateBone('mixamorigRightHand', new THREE.Euler(rotacionMano.x, rotacionMano.y, 0));
    }
    
    this.frameActual++;
  }

  private animate(): void {
    const animateLoop = () => {
      this.animationId = requestAnimationFrame(animateLoop);
      
      if (this.controls) {
        this.controls.update();
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
    
    if (palabra.keypointsFile) {
      this.reproducirSena(palabra.keypointsFile);
    }
    
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
}