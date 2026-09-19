import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Produit, Message } from '../models/produit.model';

export interface LoginResponse {
  message: string;
  token: string;
  user: { id: number; email: string; role: string };
}

export interface AdminMessage {
  id: number; nom: string; email: string; sujet?: string; message: string;
  lu: boolean | number; created_at: string;
}

export interface Visite {
  id: number; ip: string; pays: string; ville: string;
  page: string; appareil: string; navigateur: string; created_at: string;
}

export interface VisitStats {
  totalVisites: number;
  parPays:      { pays: string; total: number }[];
  parVille?:    { ville: string; pays: string; total: number }[];
  parPage:      { page: string; total: number }[];
  parAppareil:  { appareil: string; total: number }[];
  parNavigateur?: { navigateur: string; total: number }[];
  parJour?:     { jour: string; total: number }[];
}

/**
 * ApiService — point d'entrée unique vers le backend Express.
 * baseUrl provient de l'environnement (jamais d'URL en dur).
 * Le token JWT est ajouté automatiquement par l'AuthInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // --- Auth ---
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, { email, password });
  }
  me(): Observable<{ user: { id: number; email: string; role: string } }> {
    return this.http.get<{ user: { id: number; email: string; role: string } }>(`${this.base}/auth/me`);
  }

  // --- Produits (public) ---
  getProduits(lang?: 'fr' | 'en'): Observable<Produit[]> {
    const q = lang ? `?lang=${lang}` : '';
    return this.http.get<Produit[]>(`${this.base}/produits${q}`);
  }
  getProduit(id: number, lang?: 'fr' | 'en'): Observable<Produit> {
    const q = lang ? `?lang=${lang}` : '';
    return this.http.get<Produit>(`${this.base}/produits/${id}${q}`);
  }
  getProduitBySlug(slug: string, lang?: 'fr' | 'en'): Observable<Produit> {
    const q = lang ? `?lang=${lang}` : '';
    return this.http.get<Produit>(`${this.base}/produits/slug/${slug}${q}`);
  }

  // --- Produits (admin) ---
  getProduitsAll(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.base}/produits/all`);
  }
  createProduit(p: Partial<Produit>): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(`${this.base}/produits`, p);
  }
  updateProduit(id: number, p: Partial<Produit>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/produits/${id}`, p);
  }
  deleteProduit(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/produits/${id}`);
  }
  uploadImage(file: File): Observable<{ url: string; public_id: string }> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<{ url: string; public_id: string }>(`${this.base}/produits/upload`, fd);
  }

  // --- Contact ---
  sendMessage(payload: Message): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/contact`, payload);
  }
  getMessages(): Observable<AdminMessage[]> {
    return this.http.get<AdminMessage[]>(`${this.base}/contact`);
  }
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base}/contact/unread-count`);
  }
  markMessageRead(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/contact/${id}/lu`, {});
  }
  deleteMessage(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/contact/${id}`);
  }

  // --- Tracking / stats ---
  trackVisit(payload: { page: string; appareil: string; navigateur: string }): Observable<unknown> {
    return this.http.post(`${this.base}/tracking`, payload);
  }
  getVisites(): Observable<Visite[]> {
    return this.http.get<Visite[]>(`${this.base}/tracking`);
  }
  getStats(): Observable<VisitStats> {
    return this.http.get<VisitStats>(`${this.base}/tracking/stats`);
  }
}
