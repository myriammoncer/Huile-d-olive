import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LanguageService } from './core/services/language.service';
import { TrackingService } from './core/services/tracking.service';
import { SmoothScrollService } from './core/services/smooth-scroll.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  // Transition de page : fondu + léger slide à chaque navigation.
  animations: [
    trigger('routeFade', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('520ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          style({ opacity: 1, transform: 'none' })),
      ]),
    ]),
  ],
})
export class AppComponent implements OnInit {
  private language = inject(LanguageService);
  private router = inject(Router);
  private tracking = inject(TrackingService);
  private smoothScroll = inject(SmoothScrollService);

  /** Change à chaque navigation → relance l'animation de transition. */
  readonly currentUrl = signal('');

  /** Le chrome public (navbar/footer) est masqué sur les routes /admin. */
  readonly isAdmin = computed(() => this.currentUrl().startsWith('/admin'));

  /** Splash loader initial (~2.5s au premier chargement du site). */
  readonly showLoader = signal(typeof window !== 'undefined');

  /** Loader court entre les pages (~600ms fondu). */
  readonly showTransition = signal(false);
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private firstNavHandled = false;

  ngOnInit(): void {
    this.language.init();
    this.tracking.init();
    this.smoothScroll.init();  // Lenis global smooth scroll (feel Pamako)

    // Détection prefers-reduced-motion pour désactiver le splash de transition
    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    this.router.events.subscribe((e) => {
      // Démarrage d'une navigation → loader transition (sauf toute première nav
      // qui est déjà couverte par le splash initial)
      if (e instanceof NavigationStart && this.firstNavHandled && !reduced) {
        if (this.transitionTimer) clearTimeout(this.transitionTimer);
        this.showTransition.set(true);
      }
      if (e instanceof NavigationEnd) {
        const nav = e as NavigationEnd;
        this.currentUrl.set(nav.urlAfterRedirects);
        // Gestion du scroll après navigation :
        //  - Pas de fragment → toujours en haut de page (instantané)
        //  - Avec fragment → délai pour laisser le composant lazy-loaded rendre le DOM,
        //    puis scroll vers l'ancre (alignée sous la navbar via scroll-padding-top)
        if (typeof window !== 'undefined') {
          if (nav.urlAfterRedirects.includes('#')) {
            const id = nav.urlAfterRedirects.split('#')[1];
            setTimeout(() => {
              const el = document.getElementById(id);
              if (!el) return;
              const navEl = document.querySelector('.nav') as HTMLElement | null;
              const announce = document.querySelector('.announce:not(.is-hidden)') as HTMLElement | null;
              const offset = (navEl?.offsetHeight || 0) + (announce?.offsetHeight || 0) + 16;
              // Lenis-aware : scrollTo l'élément avec offset navbar
              this.smoothScroll.scrollTo(el, { offset: -offset });
            }, 450);
          } else {
            // Scroll top via Lenis (immediate pour battre les scroll intempestifs)
            const scrollTop = () => this.smoothScroll.scrollTo(0, { immediate: true });
            scrollTop();
            requestAnimationFrame(scrollTop);
            setTimeout(scrollTop, 100);
            setTimeout(scrollTop, 400);
            setTimeout(scrollTop, 800);
          }
        }
        // Masque le loader transition après un court délai
        if (this.firstNavHandled && !reduced) {
          if (this.transitionTimer) clearTimeout(this.transitionTimer);
          this.transitionTimer = setTimeout(() => this.showTransition.set(false), 500);
        }
        this.firstNavHandled = true;
      }
      if (e instanceof NavigationCancel || e instanceof NavigationError) {
        this.showTransition.set(false);
      }
    });

    if (typeof window !== 'undefined') {
      setTimeout(() => this.showLoader.set(false), reduced ? 200 : 2600);
    }
  }
}
