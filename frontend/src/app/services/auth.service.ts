// src/app/services/auth.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api.service';

const TOKEN_KEY = 'benvoplanify_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<{ access: string; refresh: string }> {
    return this.http.post<{ access: string; refresh: string }>(`${API_URL}/token/`, { email, password })
      .pipe(tap(tokens => localStorage.setItem(TOKEN_KEY, tokens.access)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const payload = this.payload();
    return !!payload && payload.exp * 1000 > Date.now();
  }

  /** Rôle lu dans le jeton ; le backend revérifie les droits à chaque appel. */
  isCoordinateur(): boolean {
    return this.isLoggedIn() && !!this.payload()?.is_staff;
  }

  private payload(): { exp: number; is_staff?: boolean } | null {
    const token = this.token;
    if (!token) {
      return null;
    }
    try {
      return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }
}
