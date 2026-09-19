import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiService, AdminMessage } from '../../../core/services/api.service';
import { AdminStateService } from '../../../core/services/admin-state.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnInit {
  private api = inject(ApiService);
  private state = inject(AdminStateService);
  private toast = inject(ToastService);

  readonly messages = signal<AdminMessage[]>([]);
  readonly loading = signal(false);
  readonly unread = computed(() => this.messages().filter((m) => !m.lu).length);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getMessages().subscribe({
      next: (rows) => {
        // non lus en premier, puis par date décroissante
        this.messages.set([...rows].sort((a, b) =>
          (Number(!!a.lu) - Number(!!b.lu)) ||
          (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())));
        this.loading.set(false);
        this.state.unread.set(this.unread());
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Chargement des messages impossible.');
      },
    });
  }

  markRead(m: AdminMessage): void {
    if (m.lu) return;
    this.api.markMessageRead(m.id).subscribe({
      next: () => {
        this.messages.update((list) =>
          list.map((x) => (x.id === m.id ? { ...x, lu: true } : x)));
        this.state.unread.set(this.unread());
      },
      error: () => this.toast.error('Impossible de marquer comme lu.'),
    });
  }

  deleteMessage(m: AdminMessage): void {
    const confirmed = typeof window !== 'undefined'
      && window.confirm(`Supprimer définitivement le message de ${m.nom} ?`);
    if (!confirmed) return;
    this.api.deleteMessage(m.id).subscribe({
      next: () => {
        this.messages.update((list) => list.filter((x) => x.id !== m.id));
        this.state.unread.set(this.unread());
        this.toast.success('Message supprimé.');
      },
      error: () => this.toast.error('Suppression impossible.'),
    });
  }

  formatDate(d: string): string {
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleString('fr-FR');
  }
}
