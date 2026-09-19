import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';
export interface Toast { id: number; type: ToastType; text: string; }

/**
 * Notifications éphémères (toasts) affichées dans un coin fixe.
 * Un seul service partagé — n'importe quel composant peut appeler
 * `toast.success(...)` / `toast.error(...)` / `toast.info(...)`.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(text: string, timeoutMs = 3500): void { this.push('success', text, timeoutMs); }
  error(text: string, timeoutMs = 5000): void   { this.push('error',   text, timeoutMs); }
  info(text: string, timeoutMs = 3500): void    { this.push('info',    text, timeoutMs); }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(type: ToastType, text: string, timeoutMs: number): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, type, text }]);
    if (timeoutMs > 0) setTimeout(() => this.dismiss(id), timeoutMs);
  }
}
