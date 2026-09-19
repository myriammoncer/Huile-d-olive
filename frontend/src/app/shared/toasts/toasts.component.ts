import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [],
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast--' + t.type">
          <span class="toast__ico" aria-hidden="true">
            @switch (t.type) {
              @case ('success') { ✓ }
              @case ('error')   { ✕ }
              @default          { i }
            }
          </span>
          <span class="toast__text">{{ t.text }}</span>
          <button type="button" class="toast__close" (click)="toast.dismiss(t.id)" aria-label="Fermer">×</button>
        </div>
      }
    </div>
  `,
  styleUrl: './toasts.component.scss',
})
export class ToastsComponent {
  readonly toast = inject(ToastService);
}
