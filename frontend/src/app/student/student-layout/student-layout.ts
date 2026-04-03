import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './student-layout.html',
  styleUrls: ['./student-layout.css']
})
export class StudentLayout {
  sidebarOpen = true;
  activeMenu = 'dashboard';

  menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Inicio' },
    { id: 'my-courses', icon: '📚', label: 'Mis Cursos' },
    { id: 'duolingo', icon: '🦉', label: 'Duolingo' },
    { id: 'dictionary', icon: '📖', label: 'Diccionario' },
    { id: 'conversation', icon: '💬', label: 'Práctica IA' },
    { id: 'evaluation', icon: '📝', label: 'Modo Evaluación' }
  ];

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setActiveMenu(id: string) {
    this.activeMenu = id;
  }
}