import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, VisitStats, Visite } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

/** Mapping léger code ISO 2 lettres → nom FR pour l'affichage. */
const COUNTRY_FR: Record<string, string> = {
  FR: 'France', TN: 'Tunisie', US: 'États-Unis', GB: 'Royaume-Uni', DE: 'Allemagne',
  IT: 'Italie', ES: 'Espagne', BE: 'Belgique', CH: 'Suisse', CA: 'Canada',
  MA: 'Maroc', DZ: 'Algérie', NL: 'Pays-Bas', PT: 'Portugal', LU: 'Luxembourg',
  Local: 'Local (dev)', Inconnu: 'Inconnu',
};

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly stats = signal<VisitStats | null>(null);
  readonly visites = signal<Visite[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.api.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.toast.error('Chargement des statistiques impossible.');
      },
    });
    this.api.getVisites().subscribe({
      next: (v) => this.visites.set(v.slice(0, 30)),
      error: () => this.toast.error('Chargement des visites impossible.'),
    });
  }

  /** Largeur en % d'une barre par rapport au maximum de la série. */
  pct(value: number, list: { total: number }[] | undefined): number {
    if (!list || list.length === 0) return 0;
    const max = Math.max(...list.map((x) => x.total), 1);
    return Math.round((value / max) * 100);
  }

  formatDate(d: string): string {
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleString('fr-FR');
  }

  countryName(code: string): string {
    return COUNTRY_FR[code] || code || 'Inconnu';
  }

  /** "2026-08-18" → "18/08" pour l'axe du sparkline. */
  shortDay(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
