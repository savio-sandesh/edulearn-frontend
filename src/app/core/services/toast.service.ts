import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = crypto.randomUUID();
    this._toasts.update(list => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(msg: string, duration?: number) { this.show(msg, 'success', duration); }
  error(msg: string, duration?: number)   { this.show(msg, 'error',   duration ?? 6000); }
  warning(msg: string, duration?: number) { this.show(msg, 'warning', duration); }
  info(msg: string, duration?: number)    { this.show(msg, 'info',    duration); }

  dismiss(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}
