import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface ReassuranceItem { icon: string; title: string; text: string; }

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly year = new Date().getFullYear();

  // Newsletter — état local (soumission côté client pour l'instant)
  readonly email = signal('');
  readonly newsletterState = signal<'idle' | 'success' | 'error'>('idle');

  submitNewsletter(): void {
    const value = this.email().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this.newsletterState.set('error');
      return;
    }
    // TODO: brancher sur l'API backend (POST /newsletter) quand disponible
    this.newsletterState.set('success');
    this.email.set('');
  }
}
