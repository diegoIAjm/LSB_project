// src/app/student/diccionario/diccionario.ts
import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SenasService, Sena, CategoriaSena } from '../../services/senas.service';
import { IAAvatarService, KeypointsFrame } from '../../services/ia-avatar.service';

@Component({
  selector: 'app-diccionario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diccionario.html',
  styleUrls: ['./diccionario.css']
})
export class DiccionarioComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('avatarContainer') avatarContainer!: ElementRef;
  
  palabras: Sena[] = [];
  categorias: CategoriaSena[] = [];
  palabrasFiltradas: Sena[] = [];
  senaActual: string = '';
  
  terminoBusqueda = '';
  categoriaSeleccionada = 0;
  mostrarModalNoDisponible = false;
  senaNoDisponible= '';
  
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private model: any;
  private animationId: number | null = null;
  private boneMap: Map<string, any> = new Map();
  private restPose: Map<string, THREE.Quaternion> = new Map();
  
  private keypointsActuales: KeypointsFrame[] = [];
  private frameActual: number = 0;
  private animandoSena: boolean = false;
  private intervaloAnimacion: any = null;
  
  loading = true;

  constructor(
    private senasService: SenasService,
    private iaAvatarService: IAAvatarService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.loadAvatar();
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
    if (this.intervaloAnimacion) clearInterval(this.intervaloAnimacion);
  }

  cargarDatos(): void {
    this.loading = true;
    
    this.senasService.getCategorias().subscribe({
      next: (categorias) => { this.categorias = categorias; },
      error: (error) => console.error('Error cargando categorías:', error)
    });
    
    this.senasService.getSenas().subscribe({
      next: (senas) => {
        this.palabras = senas;
        this.palabrasFiltradas = [...senas];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando señas:', error);
        this.loading = false;
      }
    });
  }

  // ========== THREE.JS INICIALIZACIÓN ==========
  private initThreeJS(): void {
    const container = this.avatarContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02);
    
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2, 1.5, 3);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
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
    this.scene.add(new THREE.AmbientLight(0x404060));
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
    loader.load('/assets/models/ModeloLSB.glb', 
      (gltf) => {
        this.model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(this.model);
        const size = box.getSize(new THREE.Vector3());
        const targetHeight = 1.5;
        const escala = targetHeight / Math.max(size.x, size.y, size.z);
        this.model.scale.set(escala, escala, escala);
        this.model.position.set(0, 0, 0);
        
        this.model.traverse((child: any) => {
          if (child.isBone === true || child.type === 'Bone') {
            this.boneMap.set(child.name, child);
          }
        });
        
        // Guardar pose de reposo
        this.boneMap.forEach((bone, name) => {
          this.restPose.set(name, bone.quaternion.clone());
        });
        
        console.log(`✅ ${this.boneMap.size} huesos cargados`);
        this.scene.add(this.model);
        this.controls.target.set(0, 0.75, 0);
        this.controls.update();
      },
      undefined,
      (error) => console.error('Error cargando avatar:', error)
    );
  }

  private findBone(namePattern: string): any | null {
    for (let [key, bone] of this.boneMap) {
      if (key.toLowerCase().includes(namePattern.toLowerCase())) return bone;
    }
    return null;
  }

  private resetToRestPose(): void {
    this.boneMap.forEach((bone, name) => {
      const restQuat = this.restPose.get(name);
      if (restQuat) bone.quaternion.copy(restQuat);
    });
  }

  // ========== ANIMACIÓN CON IA ==========
  seleccionarPalabra(palabra: Sena): void {

    if (!palabra.modelo_ruta) {
    this.senaNoDisponible = palabra.nombre;
    this.mostrarModalNoDisponible = true;
    return;
  }
    this.senaActual = palabra.nombre;
    this.cargarKeypointsDeSena(palabra.id);
    if (this.controls) {
      this.controls.autoRotate = false;
      setTimeout(() => { if (this.controls) this.controls.autoRotate = true; }, 3000);
    }
  }

  cerrarModalNoDisponible(): void {
  this.mostrarModalNoDisponible = false;
  this.senaNoDisponible = '';
}

  cargarKeypointsDeSena(senaId: number): void {
    console.log(`🎬 Obteniendo keypoints de IA para seña ID: ${senaId}`);
    this.iaAvatarService.getKeypointsFromSena(senaId).subscribe({
      next: (keypoints) => {
        console.log(`✅ Keypoints recibidos: ${keypoints.length} frames`);
        this.reproducirKeypoints(keypoints);
      },
      error: (error) => console.error('Error cargando keypoints:', error)
    });
  }

  reproducirKeypoints(keypoints: KeypointsFrame[]): void {
    if (!keypoints || keypoints.length === 0) return;
    
    console.log(`=== Keypoints para seña ${this.senaActual} ===`);
    const primerFrame = keypoints[0];
    if (primerFrame?.right_hand) {
      console.log(`Mano - Muñeca: (${primerFrame.right_hand[0]}, ${primerFrame.right_hand[1]})`);
    }
    
    this.keypointsActuales = keypoints;
    this.frameActual = 0;
    this.animandoSena = true;
    if (this.intervaloAnimacion) clearInterval(this.intervaloAnimacion);
    
    this.intervaloAnimacion = setInterval(() => this.actualizarPoseConKeypoints(), 50);
    setTimeout(() => {
      if (this.intervaloAnimacion) {
        clearInterval(this.intervaloAnimacion);
        this.intervaloAnimacion = null;
        this.animandoSena = false;
        this.resetToRestPose();
      }
    }, keypoints.length * 50 + 500);
  }

  private rotateBoneWithLimits(boneName: string, x: number, y: number, z: number): void {
    const bone = this.findBone(boneName);
    if (!bone) return;
    
    const limite = Math.PI / 2; // 90 grados
    const rotX = Math.max(-limite, Math.min(limite, x));
    const rotY = Math.max(-limite, Math.min(limite, y));
    const rotZ = Math.max(-limite, Math.min(limite, z));
    
    const euler = new THREE.Euler(rotX, rotY, rotZ);
    bone.quaternion.slerp(new THREE.Quaternion().setFromEuler(euler), 0.3);
  }

  private rotateBoneToPoint(boneName: string, puntoInicio: THREE.Vector3, puntoFin: THREE.Vector3): void {
    const bone = this.findBone(boneName);
    if (!bone) return;
    
    const direccion = new THREE.Vector3().subVectors(puntoFin, puntoInicio);
    if (direccion.length() < 0.01) return;
    
    direccion.normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direccion);
    bone.quaternion.slerp(quaternion, 0.3);
  }

  private animarBrazoYMano(lado: 'Right' | 'Left', handData: number[]): void {
    const prefix = lado === 'Right' ? 'mixamorigRight' : 'mixamorigLeft';
    
    // Posición de la muñeca
    const wristPos = new THREE.Vector3(handData[0], handData[1], handData[2]);
    
    // Calcular altura de la mano (0 abajo, 1 arriba)
    const alturaMano = wristPos.y;
    
    // Calcular apertura lateral (0 centro, ±1 extremos)
    const lateralMano = (wristPos.x - 0.5) * 2;
    
    // ========== HOMBRO ==========
    // Sigue la posición vertical y lateral de la mano
    const rotHombroX = (alturaMano - 0.4) * 1.8;  // Levantar brazo
    const rotHombroY = lateralMano * 0.8;         // Abrir brazo lateralmente
    const rotHombroZ = lateralMano * 0.3;         // Rotación frontal
    
    // ========== CODO ==========
    // Se dobla cuando la mano está baja
    const rotCodoX = Math.max(0, (0.7 - alturaMano) * 2.5);
    const rotCodoY = lateralMano * 0.5;
    
    // ========== ANTEBRAZO ==========
    const rotAntebrazoX = rotCodoX * 0.6;
    
    // Aplicar rotaciones
    this.rotateBoneWithLimits(`${prefix}Shoulder`, rotHombroX, rotHombroY, rotHombroZ);
    this.rotateBoneWithLimits(`${prefix}Arm`, rotCodoX, rotCodoY, 0);
    this.rotateBoneWithLimits(`${prefix}ForeArm`, rotAntebrazoX, 0, 0);
    
    // ========== MANO Y DEDOS ==========
    this.animarMano(lado, handData);
    
    if (this.frameActual % 10 === 0) {
      console.log(`Frame ${this.frameActual}: ${lado} - Altura: ${alturaMano.toFixed(3)}, HombroX: ${rotHombroX.toFixed(2)}`);
    }
  }

  private animarMano(lado: 'Right' | 'Left', handData: number[]): void {
    const prefix = lado === 'Right' ? 'mixamorigRightHand' : 'mixamorigLeftHand';
    
    // Muñeca
    const wrist = new THREE.Vector3(handData[0], handData[1], handData[2]);
    
    // Pulgar
    const thumb1 = new THREE.Vector3(handData[3], handData[4], handData[5]);
    const thumb2 = new THREE.Vector3(handData[6], handData[7], handData[8]);
    const thumb3 = new THREE.Vector3(handData[9], handData[10], handData[11]);
    
    // Índice
    const index1 = new THREE.Vector3(handData[15], handData[16], handData[17]);
    const index2 = new THREE.Vector3(handData[18], handData[19], handData[20]);
    const index3 = new THREE.Vector3(handData[21], handData[22], handData[23]);
    
    // Medio
    const middle1 = new THREE.Vector3(handData[27], handData[28], handData[29]);
    const middle2 = new THREE.Vector3(handData[30], handData[31], handData[32]);
    const middle3 = new THREE.Vector3(handData[33], handData[34], handData[35]);
    
    // Rotación de muñeca
    const rotMunecaX = (thumb1.y - wrist.y) * 1.5;
    const rotMunecaY = (thumb1.x - wrist.x) * 1.5;
    this.rotateBoneWithLimits(`${prefix}`, rotMunecaX, rotMunecaY, 0);
    
    // Pulgar
    this.rotateBoneToPoint(`${prefix}Thumb1`, thumb1, thumb2);
    this.rotateBoneToPoint(`${prefix}Thumb2`, thumb2, thumb3);
    
    // Índice
    this.rotateBoneToPoint(`${prefix}Index1`, index1, index2);
    this.rotateBoneToPoint(`${prefix}Index2`, index2, index3);
    
    // Medio
    this.rotateBoneToPoint(`${prefix}Middle1`, middle1, middle2);
    this.rotateBoneToPoint(`${prefix}Middle2`, middle2, middle3);
  }

  private actualizarPoseConKeypoints(): void {
    if (!this.animandoSena || !this.keypointsActuales || this.frameActual >= this.keypointsActuales.length) return;
    
    const frame = this.keypointsActuales[this.frameActual];
    let rightHand: number[] = [], leftHand: number[] = [];
    
    if (Array.isArray(frame)) {
      rightHand = frame.slice(99, 162);
      leftHand = frame.slice(162, 225);
    } else if (frame.right_hand && frame.left_hand) {
      rightHand = frame.right_hand;
      leftHand = frame.left_hand;
    } else {
      this.frameActual++;
      return;
    }
    
    // BRAZO Y MANO DERECHA
    if (rightHand.length >= 63 && rightHand.some(v => v !== 0)) {
      this.animarBrazoYMano('Right', rightHand);
    }
    
    // BRAZO Y MANO IZQUIERDA
    if (leftHand.length >= 63 && leftHand.some(v => v !== 0)) {
      this.animarBrazoYMano('Left', leftHand);
    }
    
    this.frameActual++;
  }

  private animate(): void {
    const animateLoop = () => {
      this.animationId = requestAnimationFrame(animateLoop);
      if (this.controls) this.controls.update();
      if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
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

  filtrarPalabras(): void {
    let filtradas = [...this.palabras];
    if (this.terminoBusqueda) {
      filtradas = filtradas.filter(p => p.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase()));
    }
    const catId = Number(this.categoriaSeleccionada);
    if (catId !== 0) filtradas = filtradas.filter(p => p.categoria_id === catId);
    this.palabrasFiltradas = filtradas;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.categoriaSeleccionada = 0;
    this.palabrasFiltradas = [...this.palabras];
  }

  getNombreCategoria(categoriaId: number): string {
    const cat = this.categorias.find(c => c.id === categoriaId);
    return cat ? cat.nombre : 'Sin categoría';
  }
}