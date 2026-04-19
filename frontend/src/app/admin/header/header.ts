import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  usuario = {
    nombre: 'Admin',
    rol: 'Administrador'
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Cargar información del usuario desde el servicio
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.usuario = {
        nombre: `${currentUser.nombre} ${currentUser.apellido}`,
        rol: currentUser.rol || 'Usuario'
      };
    }
  }

  logout(): void {
    this.authService.logout();
  }
}