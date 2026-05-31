// src/app/services/auth.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  ci: string;
  rol: string;
  rol_id: number;
  estado: string;
  estudiante_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = 'http://127.0.0.1:8000/api/auth/';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.api}login/`, { email, password }).pipe(
      tap((response: any) => {
        if (response.user) {
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          localStorage.setItem('token', response.token);
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.rol : null;
  }

  getUserRolId(): number | null {
    const user = this.getCurrentUser();
    return user ? user.rol_id : null;
  }

  // ✅ MODIFICAR ESTE MÉTODO - NO hacer llamada HTTP
  getEstudianteId(): Observable<number | null> {
    const user = this.getCurrentUser();
    console.log('Usuario actual:', user);
    
    // Usar el estudiante_id del objeto user si existe
    if (user && user.estudiante_id) {
      console.log('✅ Estudiante ID encontrado en user:', user.estudiante_id);
      return of(user.estudiante_id);
    }
    
    // Si no hay estudiante_id, usar el id del usuario (fallback)
    if (user && user.id) {
      console.log('⚠️ Usando user.id como estudiante_id:', user.id);
      return of(user.id);
    }
    
    console.log('❌ No se pudo obtener estudiante_id');
    return of(null);
  }
}