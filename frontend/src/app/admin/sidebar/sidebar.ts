import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true, // 🔥 ESTO FALTABA
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {

  @Input() collapsed = false; // 🔥 necesario para layout

  menu: any = {
    usuarios: false,
    academico: false,
    duolingo: false,
  };

  toggleMenu(menu: string) {
    this.menu[menu] = !this.menu[menu];
  }

}