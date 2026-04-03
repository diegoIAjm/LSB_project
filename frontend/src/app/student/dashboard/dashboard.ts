import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class StudentDashboard {
  stats = [
    { icon: '📚', label: 'Cursos Activos', value: '4', color: '#667eea' },
    { icon: '✅', label: 'Módulos Completados', value: '12', color: '#48bb78' },
    { icon: '⏱️', label: 'Horas de Estudio', value: '48', color: '#ed8936' },
    { icon: '🏆', label: 'Logros', value: '8', color: '#f6ad55' }
  ];

  recentCourses = [
    { name: 'Inglés Avanzado', progress: 75, icon: '🇺🇸', color: '#4299e1' },
    { name: 'Programación con IA', progress: 45, icon: '💻', color: '#9f7aea' },
    { name: 'Comunicación Efectiva', progress: 90, icon: '💬', color: '#48bb78' }
  ];

  upcomingTasks = [
    { title: 'Práctica conversacional - Unidad 3', due: 'Hoy, 6:00 PM', priority: 'high' },
    { title: 'Evaluación módulo IA', due: 'Mañana, 10:00 AM', priority: 'medium' },
    { title: 'Entregar proyecto final', due: 'Vie, 5:00 PM', priority: 'low' }
  ];

  quickAccessModules = [
    { name: 'Duolingo', icon: '🦉', color: '#58cc71', description: 'Aprendizaje gamificado' },
    { name: 'Diccionario', icon: '📖', color: '#4299e1', description: 'Traducción con IA' },
    { name: 'Práctica IA', icon: '💬', color: '#9f7aea', description: 'Conversación interactiva' },
    { name: 'Evaluación', icon: '📝', color: '#ed8936', description: 'Modo examen' }
  ];
}