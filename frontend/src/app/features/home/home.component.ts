import {
  AfterViewInit, Component, ElementRef, HostBinding, OnDestroy, OnInit, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Subscription } from 'rxjs';
import { Tilt3dDirective } from '../../shared/directives/tilt3d.directive';
import { ParallaxMouseDirective } from '../../shared/directives/parallax-mouse.directive';
import { ApiService } from '../../core/services/api.service';
import { LanguageService } from '../../core/services/language.service';
import { AnimationService } from '../../core/services/animation.service';

gsap.registerPlugin(ScrollTrigger);

interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  ctaLabel: string;
  ctaLink: string;
}

interface HighlightCard {
  slug: string;
  theme: string;   // classe theme-* pour le halo produit
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  imageAlt?: string; // seconde vue au hover (Kosterina-style). Fallback = image.
  link: string;
  badge?: string;  // badge overlay ex. "Nouveauté", "Primée", "Édition limitée"
  format?: string; // ex. "500 ml"
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, Tilt3dDirective, ParallaxMouseDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private lang = inject(LanguageService);
  private anim = inject(AnimationService);

  @HostBinding('class.is-animated') readonly animated =
    typeof window !== 'undefined'
      ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  readonly slides       = signal<HeroSlide[]>([]);
  readonly activeIndex  = signal(0);
  readonly prevIndex    = signal(-1);
  readonly AUTOPLAY_MS  = 6500;

  /** Cartes "produits phares" — chargées depuis /api/produits. Fallback statique si API down. */
  readonly highlightCards = signal<HighlightCard[]>([
    { slug: 'intense',  theme: 'theme-intense', eyebrow: 'Cuvée Intense',  title: 'Un caractère ardent',    text: 'Récolte précoce, notes herbacées puissantes.',       image: 'assets/images/Noshuiles/intensee.png',  link: '/nos-cuvees/intense',  format: '500 ml', badge: 'Bestseller' },
    { slug: 'balanced', theme: 'theme-medium',  eyebrow: 'Cuvée Balanced', title: 'L\'équilibre parfait',   text: 'Récolte de mi-saison, rondeur et fruité.',           image: 'assets/images/Noshuiles/balanced.png',  link: '/nos-cuvees/balanced', format: '500 ml' },
    { slug: 'delicate', theme: 'theme-mild',    eyebrow: 'Cuvée Délicate', title: 'La douceur du terroir',  text: 'Récolte tardive, notes rondes et beurrées.',         image: 'assets/images/Noshuiles/delicate.png',  link: '/nos-cuvees/delicate', format: '500 ml', badge: 'Nouveauté' },
  ]);

  private readonly THEME_BY_GAMME: Record<string, string> = {
    intense: 'theme-intense', balanced: 'theme-medium', delicate: 'theme-mild', hp: 'theme-hp',
  };
  private readonly IMAGE_BY_GAMME: Record<string, string> = {
    intense: 'assets/images/Noshuiles/intensee.png',
    balanced: 'assets/images/Noshuiles/balanced.png',
    delicate: 'assets/images/Noshuiles/delicate.png',
    hp: 'assets/images/accueil/highplyy.jpg',
  };

  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private paused = false;
  private triggers: ScrollTrigger[] = [];
  private safety: ReturnType<typeof setTimeout> | null = null;
  private subs = new Subscription();

  /** Association slide → média (image ou vidéo). Utilise les vraies photos assets/images/. */
  private readonly slideMedia: Record<string, string> = {
    'cuvees':          'assets/images/accueil/3cuv.jpg',
    'high-polyphenol': 'assets/images/Noshuiles/hprmvv.png',
    'private-label':   'assets/images/photos/pro2.png',
    // Legacy (au cas où) — anciens IDs
    'notre-histoire':  'assets/images/Notre_Hist/bandeau.png',
    'coffrets':        'assets/images/accueil/cadeau.jpg',
    'tracabilite':     'assets/images/accueil/tracaa.png',
    'coffret-cadeau':  'assets/images/accueil/coffretrmg.png',
    'professionnels':  'assets/images/photos/pro2.png',
  };

  slideImage(id: string): string {
    return this.slideMedia[id] ?? 'assets/images/accueil/barahuile.png';
  }

  /** Image de la cuvée pour la showcase (fallback local par slug). */
  cuveeImage(slug: string): string {
    const map: Record<string, string> = {
      intense:  'assets/images/Noshuiles/intrmvv.png',
      balanced: 'assets/images/Noshuiles/balrmvv.png',
      delicate: 'assets/images/Noshuiles/delrmvv.png',
    };
    return map[slug] ?? 'assets/images/Noshuiles/intensee.png';
  }
  /** Détecte si le média est une vidéo (.mp4, .webm) pour rendre <video> à la place de <img>. */
  isVideo(id: string): boolean {
    return /\.(mp4|webm|mov)$/i.test(this.slideImage(id));
  }

  /** Décompose "/nos-cuvees#coffrets" pour Angular Router. */
  linkPath(url: string): string {
    return (url ?? '/').split('#')[0] || '/';
  }
  linkFragment(url: string): string | undefined {
    const [, hash] = (url ?? '').split('#');
    return hash || undefined;
  }

  ngOnInit(): void {
    this.subs.add(this.translate.get('home.hero.slides').subscribe((arr: HeroSlide[]) => {
      if (Array.isArray(arr)) this.slides.set(arr);
    }));
    this.subs.add(this.translate.onLangChange.subscribe(() => {
      this.translate.get('home.hero.slides').subscribe((arr: HeroSlide[]) => {
        if (Array.isArray(arr)) this.slides.set(arr);
      });
      this.loadHighlightsFromApi();
    }));
    this.loadHighlightsFromApi();
  }

  /** Charge les 3 cuvées (hors HP) depuis /api/produits pour peupler les cards phares. */
  private loadHighlightsFromApi(): void {
    const currentLang = this.lang.current() === 'en' ? 'en' : 'fr';
    this.api.getProduits(currentLang).subscribe({
      next: (list) => {
        const cards: HighlightCard[] = list
          .filter(p => p.gamme !== 'hp')
          .slice(0, 3)
          .map((p, i) => {
            const g = (p.gamme || 'intense') as string;
            const nom = (p as any).nom || p.nom_fr;
            const leadShort = (p as any).lead_short || p.lead_short_fr || '';
            const subtitle = (p as any).subtitle || p.subtitle_fr || '';
            return {
              slug:    p.slug || g,
              theme:   this.THEME_BY_GAMME[g] || 'theme-intense',
              eyebrow: nom,
              title:   subtitle || nom,
              text:    leadShort,
              image:   p.image_url || this.IMAGE_BY_GAMME[g] || this.IMAGE_BY_GAMME['intense'],
              link:    `/nos-cuvees/${p.slug || g}`,
              format:  p.format,
              badge:   i === 0 ? this.translate.instant('home.badge.bestseller')
                               : (i === 2 ? this.translate.instant('home.badge.new') : undefined),
            };
          });
        if (cards.length) this.highlightCards.set(cards);
      },
      error: (err) => console.warn('API produits indisponible, fallback statique utilisé.', err),
    });
  }

  ngAfterViewInit(): void {
    this.startAutoplay();

    // Play l'animation d'entrée hero
    const heroContent = this.host.nativeElement.querySelectorAll<HTMLElement>('.hero-slide.is-active .hero-tile__body > *');
    if (this.animated && heroContent.length) {
      gsap.fromTo(heroContent, { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.15 });
    }

    if (!this.animated) { this.forceReveal(); return; }
    const root = this.host.nativeElement as HTMLElement;

    // Reveal éléments non-hero — feel Pamako (durée longue, easing power4, offset généreux)
    const revealEls = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    const vh = window.innerHeight;
    revealEls.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const alreadyVisible = rect.top < vh * 0.92;
      const anim = { y: 60, opacity: 0 };
      const to  = { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out' };
      if (alreadyVisible) {
        gsap.fromTo(el, anim, { ...to, delay: Math.min(1.0, 0.2 + i * 0.05) });
      } else {
        const t = gsap.fromTo(el, anim,
          { ...to, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
        if (t.scrollTrigger) this.triggers.push(t.scrollTrigger);
      }
    });

    // Setup Pamako-style animations (mask reveal titres · clip images · parallax · rules)
    this.setupPamakoAnimations();

    setTimeout(() => ScrollTrigger.refresh(), 400);
    this.safety = setTimeout(() => this.forceReveal(), 2500);

    // Compteurs animés désactivés : les chiffres s'affichent directement (spec finale).
  }

  /** Compteurs supprimés — les valeurs sont affichées telles quelles dans le template. */
  private setupStatCounters(): void { /* noop */ }

  /**
   * Animations style Pamako :
   * - Titres h2 : mask reveal from bottom (clip-path animé, feel éditorial)
   * - Images (.img-frame, .highlight-card__media, .savoir-faire__frame) : clip-path bottom→up
   *   + inner scale 1.1 → 1 en parallèle (Ken Burns discret)
   * - Filets .olive-rule / .stats__sep : scaleX 0 → 1 dessiné doux
   * - Hero image + card images : parallax scroll (translation Y légère au scroll)
   */
  private setupPamakoAnimations(): void {
    if (!this.animated) return;
    const root = this.host.nativeElement as HTMLElement;

    // ─── 1. TITRES h2 en mask reveal ─────────────────────────
    const titles = Array.from(root.querySelectorAll<HTMLElement>(
      'h2:not(.hero-slide__title)'
    ));
    titles.forEach(el => {
      gsap.set(el, { clipPath: 'inset(0 0 100% 0)', y: 30 });
      const t = gsap.to(el, {
        clipPath: 'inset(0 0 0% 0)',
        y: 0,
        duration: 1.3,
        ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
      if (t.scrollTrigger) this.triggers.push(t.scrollTrigger);
    });

    // ─── 2. IMAGES en clip-reveal + inner scale ──────────────
    const imageFrames = Array.from(root.querySelectorAll<HTMLElement>(
      '.highlights__grid .highlight-card__media, .savoir-faire__frame, .intro__inner .img-frame'
    ));
    imageFrames.forEach(frame => {
      const img = frame.querySelector<HTMLElement>('img');
      gsap.set(frame, { clipPath: 'inset(100% 0 0 0)' });
      if (img) gsap.set(img, { scale: 1.15 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: frame, start: 'top 85%', once: true },
      });
      tl.to(frame, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'power4.out' });
      if (img) tl.to(img, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0);
      if (tl.scrollTrigger) this.triggers.push(tl.scrollTrigger);
    });

    // ─── 3. FILETS .olive-rule qui se dessinent ─────────────
    const rules = Array.from(root.querySelectorAll<HTMLElement>('.olive-rule'));
    rules.forEach(rule => {
      gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' });
      const t = gsap.to(rule, {
        scaleX: 1,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: rule, start: 'top 92%', once: true },
      });
      if (t.scrollTrigger) this.triggers.push(t.scrollTrigger);
    });

    // ─── 4. PARALLAX subtil sur les visuels non-hero ──────────
    // (Skip hero: conflits avec Ken Burns + fade actif. Skip cards: conflits avec hover scale.)
    // On applique le parallax uniquement aux images qui ne bougent pas déjà.
    const parallaxImages = Array.from(root.querySelectorAll<HTMLElement>(
      '.savoir-faire__frame img, .intro__inner .img-frame img'
    ));
    parallaxImages.forEach(img => {
      const container = img.closest('.img-frame, .savoir-faire__frame') as HTMLElement | null;
      if (!container) return;
      const t = gsap.fromTo(img,
        { yPercent: -6 },
        { yPercent: 6, ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      if (t.scrollTrigger) this.triggers.push(t.scrollTrigger);
    });

    // ─── 5. STATS panel : animation supprimée (chiffres directs) ──
  }

  private forceReveal(): void {
    (this.host.nativeElement as HTMLElement)
      .querySelectorAll<HTMLElement>('.reveal')
      .forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
  }

  // ---- Carrousel ----
  goTo(i: number): void {
    if (!this.slides().length) return;
    this.prevIndex.set(this.activeIndex());
    this.activeIndex.set(((i % this.slides().length) + this.slides().length) % this.slides().length);
    this.animateActive();
    this.restartAutoplay();
  }
  next(): void { this.goTo(this.activeIndex() + 1); }
  prev(): void { this.goTo(this.activeIndex() - 1); }

  private animateActive(): void {
    if (!this.animated) return;
    setTimeout(() => {
      const el = this.host.nativeElement.querySelectorAll<HTMLElement>('.hero-slide.is-active .hero-tile__body > *');
      if (el.length) {
        gsap.fromTo(el, { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08 });
      }
    }, 40);
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => { if (!this.paused) this.next(); }, this.AUTOPLAY_MS);
  }
  private stopAutoplay(): void {
    if (this.autoplayTimer) { clearInterval(this.autoplayTimer); this.autoplayTimer = null; }
  }
  private restartAutoplay(): void { this.startAutoplay(); }

  pauseAuto():  void { this.paused = true; }
  resumeAuto(): void { this.paused = false; }

  /** Scroll doux depuis le hero vers la section suivante (introduction). */
  scrollToNext(): void {
    const target = this.host.nativeElement.querySelector('.intro')
      || this.host.nativeElement.querySelector('.highlights');
    (target as HTMLElement | null)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    this.subs.unsubscribe();
    this.triggers.forEach(t => t.kill());
    if (this.safety) clearTimeout(this.safety);
  }
}
