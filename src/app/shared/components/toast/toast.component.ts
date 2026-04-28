import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast-{{ t.type }}" (click)="toast.dismiss(t.id)">
          <span class="toast-icon">{{ icons[t.type] }}</span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" (click)="toast.dismiss(t.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 80px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px;
      pointer-events: none;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: 12px;
      min-width: 280px; max-width: 380px;
      font-size: 0.875rem; font-weight: 500;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      animation: slideIn 0.3s ease;
      cursor: pointer; pointer-events: all;
      border: 1px solid transparent;
    }
    .toast-success { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #34d399; }
    .toast-error   { background: rgba(239,68,68,0.15);  border-color: rgba(239,68,68,0.3);  color: #f87171; }
    .toast-warning { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.3); color: #fbbf24; }
    .toast-info    { background: rgba(14,165,233,0.15); border-color: rgba(14,165,233,0.3); color: #38bdf8; }
    .toast-icon    { font-size: 1.1rem; flex-shrink: 0; }
    .toast-msg     { flex: 1; color: #e2e8f0; }
    .toast-close   { opacity: 0.5; font-size: 0.8rem; margin-left: 4px; padding: 2px 6px;
                     border-radius: 4px; background: rgba(255,255,255,0.1); }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastComponent {
  readonly toast = inject(ToastService);
  readonly icons: Record<string, string> = {
    success: '✓', error: '✕', warning: '⚠', info: 'ℹ'
  };
}
