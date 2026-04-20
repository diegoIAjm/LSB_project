import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { DuolingoService, Puntos } from '../../../services/duolingo';

@Component({
  selector: 'app-duolingo-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './duolingo-layout.html',
  styleUrls: ['./duolingo-layout.css']
})
export class DuolingoLayoutComponent implements OnInit {
  sidebarOpen = true;
  puntos: Puntos | null = null;
  estudianteId: number | null = null;

  menuItems = [
    { id: 'aprender', icon: '📚', label: 'Aprender', path: '/student/duolingo/niveles' },
    { id: 'practicar', icon: '🎯', label: 'Practicar', path: '/student/duolingo/practicar' },
    { id: 'ranking', icon: '🏆', label: 'Ranking', path: '/student/duolingo/ranking' }
  ];

  constructor(
    public authService: AuthService,
    private duolingoService: DuolingoService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.estudianteId = user.id;
      this.cargarPuntos();
    }
  }

  cargarPuntos(): void {
    if (this.estudianteId) {
      this.duolingoService.getPuntos(this.estudianteId).subscribe({
        next: (puntos) => {
          this.puntos = puntos;
        },
        error: (err) => console.error('Error al cargar puntos:', err)
      });
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}