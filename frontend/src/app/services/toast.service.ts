import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private prochainId = 1;

  success(message: string) { this.afficher('success', message); }
  error(message: string) { this.afficher('error', message); }
  info(message: string) { this.afficher('info', message); }

  fermer(id: number) {
    this.toasts.update(liste => liste.filter(t => t.id !== id));
  }

  private afficher(type: Toast['type'], message: string) {
    const id = this.prochainId++;
    this.toasts.update(liste => [...liste, { id, type, message }]);
    setTimeout(() => this.fermer(id), 4000);
  }
}
