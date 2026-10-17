import { Component } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toasts',
  imports: [IconComponent],
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="'toast ' + toast.type" role="status">
          <app-icon [name]="toast.type === 'error' ? 'alert' : 'check'" />
          <span>{{ toast.message }}</span>
          <button type="button" class="close" (click)="toasts.fermer(toast.id)" aria-label="Fermer">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toasts {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: calc(100vw - 40px);
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 260px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 4px solid var(--primary);
      box-shadow: var(--shadow-lg);
      font-size: 0.9rem;
      animation: entree 0.2s ease-out;
    }
    .toast.success { border-left-color: var(--success); }
    .toast.success app-icon { color: var(--success); }
    .toast.error { border-left-color: var(--danger); }
    .toast.error app-icon { color: var(--danger); }
    .toast span { flex: 1; }
    .close {
      border: none;
      background: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 2px;
    }
    @keyframes entree {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
  `],
})
export class ToastsComponent {
  constructor(public toasts: ToastService) {}
}
