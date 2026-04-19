import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class TeacherDashboard {
  stats = [
    { icon: '📚', label: 'Cursos Activos', value: '4', color: '#3b82f6' },
    { icon: '👥', label: 'Estudiantes', value: '48', color: '#10b981' },
    { icon: '✅', label: 'Tareas Calificadas', value: '32', color: '#f59e0b' },
    { icon: '⭐', label: 'Valoración Promedio', value: '4.8', color: '#8b5cf6' }
  ];
}