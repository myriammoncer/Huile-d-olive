import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ApiService } from './api.service';

/**
 * TrackingService — enregistre chaque visite de page côté backend
 * (POST /api/tracking). Le backend complète pays/ville via l'IP (ip-api.com).
 * On envoie : page, type d'appareil, navigateur.
 */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  private router = inject(Router);
  private api = inject(ApiService);

  private lastPage = '';

  init(): void {
    if (typeof window === 'undefined') return;

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        const page = (e as NavigationEnd).urlAfterRedirects || '/';
        if (page === this.lastPage) return; // évite les doublons
        this.lastPage = page;
        this.send(page);
      });
  }

  private send(page: string): void {
    this.api.trackVisit({
      page,
      appareil: this.detectDevice(),
      navigateur: this.detectBrowser(),
    }).subscribe({
      next: () => {},
      error: () => {}, // le tracking ne doit jamais perturber l'expérience
    });
  }

  private detectDevice(): string {
    const ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'Mobile';
    if (/iPad|Tablet/i.test(ua)) return 'Tablette';
    return 'Ordinateur';
  }

  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (/Edg\//i.test(ua)) return 'Edge';
    if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
    if (/Chrome\//i.test(ua)) return 'Chrome';
    if (/Firefox\//i.test(ua)) return 'Firefox';
    if (/Safari\//i.test(ua)) return 'Safari';
    return 'Autre';
  }
}
