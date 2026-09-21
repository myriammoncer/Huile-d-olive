import {
  AfterViewInit, Component, ElementRef, HostBinding, OnDestroy, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Subscription } from 'rxjs';
import { ParallaxMouseDirective } from '../../../shared/directives/parallax-mouse.directive';
import { Tilt3dDirective } from '../../../shared/directives/tilt3d.directive';

import { ApiService } from '../../../core/services/api.service';
import { LanguageService } from '../../../core/services/language.service';
import { Produit } from '../../../core/models/produit.model';

gsap.registerPlugin(ScrollTrigger);

const IMAGE_BY_GAMME: Record<string, string> = {
  intense:  'assets/images/Noshuiles/intrmvv.png',
  balanced: 'assets/images/Noshuiles/balrmvv.png',
  delicate: 'assets/images/Noshuiles/delrmvv.png',
  hp:       'assets/images/accueil/highplyy.jpg',
};
const THEME_BY_GAMME: Record<string, string> = {
  intense:  'theme-intense',
  balanced: 'theme-medium',
  delicate: 'theme-mild',
  hp:       'theme-hp',
};

interface OtherCuvee {
  slug: string; name: string; subtitle: string; theme: string; image: string;
}

@Component({
  selector: 'app-cuvee-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ParallaxMouseDirective, Tilt3dDirective],
  templateUrl: './cuvee-detail.component.html',
  styleUrl: './cuvee-detail.component.scss',
})
export class CuveeDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private translate = inject(TranslateService);
  private api       = inject(ApiService);
  private lang      = inject(LanguageService);
  private host: ElementRef<HTMLElement> = inject(ElementRef);

  @HostBinding('class.is-animated') readonly animated =
    typeof window !== 'undefined'
      ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  readonly slug   = signal<string>('intense');
  readonly cuvee  = signal<Produit | null>(null);
  readonly loading = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly allCuvees = signal<Produit[]>([]);

  readonly theme = computed(() => THEME_BY_GAMME[this.cuvee()?.gamme || 'intense'] || 'theme-intense');
  readonly image = computed(() => {
    const c = this.cuvee();
    if (!c) return IMAGE_BY_GAMME['intense'];
    return c.image_url || IMAGE_BY_GAMME[c.gamme || 'intense'] || IMAGE_BY_GAMME['intense'];
  });

  // Accesseurs sûrs (le compilateur Angular ne suit pas l'alias dans @else if imbriqué)
  readonly cuveeName        = computed(() => { const c: any = this.cuvee(); return c?.nom || c?.nom_fr || ''; });
  readonly cuveeSubtitle    = computed(() => { const c: any = this.cuvee(); return c?.subtitle || c?.subtitle_fr || ''; });
  readonly cuveeDescription = computed(() => { const c: any = this.cuvee(); return c?.description || c?.description_fr || ''; });
  readonly cuveeProfile     = computed(() => { const c: any = this.cuvee(); return c?.profil_aromatique || c?.profil_aromatique_fr || ''; });
  readonly cuveeHarvest     = computed(() => { const c: any = this.cuvee(); return c?.harvest || c?.harvest_fr || ''; });
  readonly cuveeVariete     = computed(() => this.cuvee()?.variete || '');
  readonly cuveeFormat      = computed(() => this.cuvee()?.format || '');

  /** Numéro d'ordre 01/02/03 selon la cuvée. */
  readonly cuveeNum = computed(() => {
    const map: Record<string, string> = { intense: '01', balanced: '02', medium: '02', delicate: '03', mild: '03' };
    return map[this.slug()] || map[this.cuvee()?.gamme || ''] || '01';
  });

  readonly others = computed<OtherCuvee[]>(() =>
    this.allCuvees()
      .filter(p => p.slug !== this.slug() && p.gamme !== 'hp')
      .map(p => ({
        slug: p.slug,
        name: (p as any).nom || p.nom_fr,
        subtitle: (p as any).subtitle || p.subtitle_fr || '',
        theme: THEME_BY_GAMME[p.gamme || 'intense'] || 'theme-intense',
        image: p.image_url || IMAGE_BY_GAMME[p.gamme || 'intense'] || IMAGE_BY_GAMME['intense'],
      }))
  );

  /** Renvoie les pairings sous forme de liste : suggestions_fr peut être "a, b, c" */
  readonly pairings = computed<string[]>(() => {
    const c = this.cuvee();
    const raw = (c as any)?.suggestions || c?.suggestions_fr || '';
    return raw ? raw.split(/[,•·]/).map((s: string) => s.trim()).filter(Boolean) : [];
  });

  /** Icône d'accord selon le mot-clé du plat (fin & élégante). */
  pairingIcon(label: string): string {
    const s = label.toLowerCase();
    if (/salade|verdure|légume|legume|herbe/.test(s))              return 'leaf';
    if (/tomate|bruschetta|pizza|pâtes|pates|pasta/.test(s))       return 'tomato';
    if (/poisson|fish|thon|saumon|crustac|fruit de mer/.test(s))   return 'fish';
    if (/viande|boeuf|agneau|steak|grill/.test(s))                 return 'meat';
    if (/poulet|volaille|dinde/.test(s))                            return 'poultry';
    if (/pain|bread|toast|tartine/.test(s))                         return 'bread';
    if (/fromage|cheese|burrata|mozzarella|feta/.test(s))          return 'cheese';
    if (/dessert|fruit|pomme|pâtisserie|patisserie|gâteau/.test(s)) return 'sweet';
    if (/soupe|velouté|potage/.test(s))                            return 'soup';
    if (/pâtes|pates|pasta|riz|risotto/.test(s))                   return 'pasta';
    return 'plate';
  }

  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(this.route.paramMap.subscribe(pm => {
      const slug = pm.get('slug') || 'intense';
      this.slug.set(slug);
      this.loadCuvee();
    }));
    this.subs.add(this.translate.onLangChange.subscribe(() => this.loadCuvee()));
    this.loadAllCuvees();
  }

  private loadCuvee(): void {
    const currentLang = this.lang.current() === 'en' ? 'en' : 'fr';
    this.loading.set(true);
    this.errorMsg.set(null);
    this.api.getProduitBySlug(this.slug(), currentLang).subscribe({
      next: (p) => {
        this.cuvee.set(p);
        this.loading.set(false);
        requestAnimationFrame(() => this.playEnter());
      },
      error: (err) => {
        if (err.status === 404) {
          this.router.navigate(['/nos-cuvees']);
          return;
        }
        console.error('Erreur chargement cuvée :', err);
        this.errorMsg.set(this.translate.instant('cuvees.detail.loadError'));
        this.loading.set(false);
      },
    });
  }

  private loadAllCuvees(): void {
    const currentLang = this.lang.current() === 'en' ? 'en' : 'fr';
    this.api.getProduits(currentLang).subscribe({
      next: (list) => this.allCuvees.set(list),
      error: () => this.allCuvees.set([]),
    });
  }

  ngAfterViewInit(): void {
    if (!this.animated) this.forceReveal();
  }

  private playEnter(): void {
    if (!this.animated) { this.forceReveal(); return; }
    const root = this.host.nativeElement as HTMLElement;
    gsap.fromTo(root.querySelectorAll('.reveal'),
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.15 });
    const bottle = root.querySelector<HTMLElement>('.detail__bottle');
    if (bottle) {
      gsap.fromTo(bottle, { y: 60, opacity: 0, rotate: -3 },
        { y: 0, opacity: 1, rotate: 0, duration: 1.2, ease: 'power3.out', delay: 0.2 });
    }
  }

  private forceReveal(): void {
    (this.host.nativeElement as HTMLElement)
      .querySelectorAll<HTMLElement>('.reveal')
      .forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
