import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class Layout implements OnInit {
  sidebarOpen = true;
  usuario: any = null;

  menu = {
    usuarios: false,
    academico: false,
    duolingo: false
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.usuario = this.authService.getCurrentUser();
    console.log('Admin logueado:', this.usuario);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleMenu(menu: string) {
    this.menu[menu as keyof typeof this.menu] = !this.menu[menu as keyof typeof this.menu];
  }

  logout(): void {
    this.authService.logout();
  }
}