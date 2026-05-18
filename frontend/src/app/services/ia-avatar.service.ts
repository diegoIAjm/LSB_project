// src/app/services/ia-avatar.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KeypointsFrame {
  pose: number[];
  right_hand: number[];
  left_hand: number[];
}

@Injectable({
  providedIn: 'root'
})
export class IAAvatarService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getKeypointsFromSena(senaId: number): Observable<KeypointsFrame[]> {
    // URL CORRECTA: /api/senas/senas/{id}/keypoints/
    return this.http.get<KeypointsFrame[]>(`${this.apiUrl}/senas/senas/${senaId}/keypoints/`);
  }
}