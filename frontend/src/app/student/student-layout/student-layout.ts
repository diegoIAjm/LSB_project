import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './student-layout.html',
  styleUrls: ['./student-layout.css']
})
export class StudentLayout {
  sidebarOpen = true;
  activeMenu = 'dashboard';

  menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Inicio', path: '/student/dashboard' },
    { id: 'my-courses', icon: '📚', label: 'Mis Cursos', path: '/student/mis-cursos' },
    { id: 'diccionario', icon: '📖', label: 'Diccionario', path: '/student/diccionario' },
    { id: 'duolingo', icon: '🦉', label: 'Duolingo', path: '/student/duolingo' },
    { id: 'conversation', icon: '💬', label: 'Práctica IA', path: '/student/conversation' },
    { id: 'evaluation', icon: '📝', label: 'Modo Evaluación', path: '/student/evaluation' }
  ];

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setActiveMenu(id: string) {
    this.activeMenu = id;
  }
}