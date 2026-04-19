import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, User } from '../../services/auth';

@Component({
  selector: 'app-teacher-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './teacher-layout.html',
  styleUrls: ['./teacher-layout.css']
})
export class TeacherLayout implements OnInit {
  sidebarOpen = true;
  private authService: AuthService = inject(AuthService);
  usuario: User | null = null;

  ngOnInit(): void {
    this.usuario = this.authService.getCurrentUser();
    console.log('Usuario logueado:', this.usuario);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}