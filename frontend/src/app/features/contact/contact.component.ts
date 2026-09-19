import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

type Status = 'idle' | 'sending' | 'success' | 'error';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Sujet pré-rempli via query param, ex. /contact?sujet=Private+Label
    const sujet = this.route.snapshot.queryParamMap.get('sujet');
    if (sujet) this.form.patchValue({ subject: sujet });
  }

  readonly status = signal<Status>('idle');

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
    // Anti-spam basique : champ piège, invisible pour l'utilisateur.
    website: [''],
  });

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.status() === 'sending') return;

    // Honeypot rempli → bot : on simule un succès sans rien envoyer.
    if (this.form.value.website) { this.status.set('success'); return; }

    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const { name, email, subject, message } = this.form.value;

    this.status.set('sending');
    this.api.sendMessage({
      nom: name ?? '',
      email: email ?? '',
      sujet: subject ?? '',
      message: message ?? '',
    }).subscribe({
      next: () => {
        this.status.set('success');
        this.form.reset();
      },
      error: () => this.status.set('error'),
    });
  }
}
