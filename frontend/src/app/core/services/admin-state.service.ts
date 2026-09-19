import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

/** État partagé de l'admin (ex. compteur de messages non lus pour le badge). */
@Injectable({ providedIn: 'root' })
export class AdminStateService {
  private api = inject(ApiService);

  readonly unread = signal(0);

  refreshUnread(): void {
    this.api.getMessages().subscribe({
      next: (msgs) => this.unread.set(msgs.filter((m) => !m.lu).length),
      error: () => {},
    });
  }
}
