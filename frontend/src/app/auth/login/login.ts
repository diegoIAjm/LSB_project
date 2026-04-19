import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import * as THREE from 'three';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  
  email = '';
  password = '';
  error = '';
  loading = false;
  mostrarPassword = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles: THREE.Points | null = null;
  private cube: THREE.Mesh | null = null;
  private sphere: THREE.Mesh | null = null;
  private torus: THREE.Mesh | null = null;
  private animationId: number | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.redirigirPorRol();
    }
  }

  ngAfterViewInit(): void {
    this.initThreeJS();
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
    const container = this.canvasContainer.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a2a);

    // Cámara
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 30;

    // Renderizador
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Partículas
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 100;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 60;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 50 - 20;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.15,
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);

    // Cubo 3D
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4f46e5,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x1e1b4b
    });
    this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.cube.position.set(5, -2, -5);
    this.scene.add(this.cube);

    // Esfera
    const sphereGeometry = new THREE.SphereGeometry(1.5, 64, 64);
    const sphereMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x06b6d4,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0x083344
    });
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.sphere.position.set(-6, 1, -8);
    this.scene.add(this.sphere);

    // Toro
    const torusGeometry = new THREE.TorusGeometry(2, 0.3, 64, 200);
    const torusMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xec4899,
      metalness: 0.8,
      roughness: 0.1,
      emissive: 0x4c0519
    });
    this.torus = new THREE.Mesh(torusGeometry, torusMaterial);
    this.torus.position.set(0, -3, -10);
    this.scene.add(this.torus);

    // Luces
    const ambientLight = new THREE.AmbientLight(0x404060);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);

    const coloredLight = new THREE.PointLight(0x4f46e5, 0.8);
    coloredLight.position.set(-5, 5, 8);
    this.scene.add(coloredLight);

    const backLight = new THREE.PointLight(0x06b6d4, 0.5);
    backLight.position.set(0, 0, -15);
    this.scene.add(backLight);

    // Animación
    let time = 0;
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      time += 0.005;

      if (this.particles) {
        this.particles.rotation.y = time * 0.1;
        this.particles.rotation.x = Math.sin(time * 0.2) * 0.1;
      }
      
      if (this.cube) {
        this.cube.rotation.x = time * 0.5;
        this.cube.rotation.y = time * 0.8;
      }
      
      if (this.sphere) {
        this.sphere.rotation.y = time * 0.3;
        this.sphere.rotation.x = time * 0.2;
      }
      
      if (this.torus) {
        this.torus.rotation.x = time * 0.6;
        this.torus.rotation.y = time * 0.4;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    animate();

    // Redimensionar
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  redirigirPorRol(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      if (user.rol_id === 1) {
        this.router.navigate(['/admin/dashboard']);
      } else if (user.rol_id === 2) {
        this.router.navigate(['/teacher/dashboard']);
      } else if (user.rol_id === 3) {
        this.router.navigate(['/student/dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

onSubmit(): void {
  this.error = '';
  
  if (!this.email || !this.password) {
    this.error = 'Por favor, complete todos los campos';
    return;
  }

  this.loading = true;
  this.cdr.detectChanges();

  this.authService.login(this.email, this.password).subscribe({
    next: () => {
      this.loading = false;
      this.cdr.detectChanges();
      this.redirigirPorRol();
    },
    error: (err: any) => {
      this.error = 'Correo o contraseña incorrectos';
      this.loading = false;
      this.password = '';
      this.cdr.detectChanges();
    }
  });
}
}