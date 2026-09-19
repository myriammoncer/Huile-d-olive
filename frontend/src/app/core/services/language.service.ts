import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'fr' | 'en';
const STORAGE_KEY = 'village1800_lang';

/**
 * LanguageService — pilote ngx-translate, persiste le choix en localStorage,
 * expose la langue courante en signal pour le contenu dynamique bilingue.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);

  /** Langue courante, réactive (utile pour choisir nom_fr / nom_en). */
  readonly current = signal<Lang>('fr');

  init(): void {
    this.translate.addLangs(['fr', 'en']);
    this.translate.setDefaultLang('fr');
    const saved = (this.readStored() ?? 'fr') as Lang;
    this.use(saved);
  }

  use(lang: Lang): void {
    this.translate.use(lang);
    this.current.set(lang);
    this.persist(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  toggle(): void {
    this.use(this.current() === 'fr' ? 'en' : 'fr');
  }

  /** Renvoie la valeur bilingue selon la langue active (contenu dynamique). */
  pick<T>(fr: T, en: T): T {
    return this.current() === 'en' ? en : fr;
  }

  private readStored(): string | null {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }
  private persist(lang: Lang): void {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  }
}
