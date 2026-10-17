import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Profil } from '../models';

/** Profil de l'utilisateur connecté, partagé entre la barre latérale et les pages. */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  readonly profil = signal<Profil | null>(null);

  constructor(private api: ApiService) {}

  rafraichir(): void {
    this.api.getProfil().subscribe({
      next: profil => this.profil.set(profil),
      error: () => {},
    });
  }

  vider(): void {
    this.profil.set(null);
  }
}
