import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService, LoginResponse } from './api.service';

const TOKEN_KEY = 'village1800_token';
const USER_KEY = 'village1800_user';

interface AdminUser { id: number; email: string; role: string; }

/**
 * AuthService — login admin (JWT), persistance du token, état réactif.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);

  readonly user = signal<AdminUser | null>(this.readUser());
  readonly isLoggedIn = computed(() => !!this.user() && !!this.token);

  get token(): string | null {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api.login(email, password).pipe(
      tap((res) => {
        try {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        } catch { /* ignore */ }
        this.user.set(res.user);
      }),
    );
  }

  logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
    this.user.set(null);
  }

  private readUser(): AdminUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AdminUser) : null;
    } catch { return null; }
  }
}
