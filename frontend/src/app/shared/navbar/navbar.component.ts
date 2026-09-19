import {
  AfterViewInit, Component, HostListener, OnDestroy, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, filter } from 'rxjs';
import gsap from 'gsap';

import { LanguageService, Lang } from '../../core/services/language.service';

interface NavItem { key: string; link: string; }
interface SubItem { label: string; anchor: string; isHeading?: boolean; child?: boolean; }

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  private router    = inject(Router);
  private translate = inject(TranslateService);
  readonly lang     = inject(LanguageService);

  /** 7 items — libellés via i18n `nav.*`. */
  readonly items: NavItem[] = [
    { key: 'home',         link: '/' },
    { key: 'history',      link: '/notre-histoire' },
    { key: 'hp',           link: '/high-polyphenol' },
    { key: 'cuvees',       link: '/nos-cuvees' },
    { key: 'traceability', link: '/tracabilite' },
    { key: 'coffret',      link: '/coffret-cadeau' },
    { key: 'pro',          link: '/professionnels' },
    { key: 'pl',           link: '/private-label' },
  ];

  readonly scrolled   = signal(false);
  readonly isHome     = signal(true);
  readonly mobileOpen = signal(false);
  readonly hovered    = signal<NavItem | null>(null);
  readonly subitems   = signal<SubItem[]>([]);
  readonly mobileOpenItem = signal<string | null>(null);

  /** Navbar toujours blanche (spec client) — état transparent désactivé. */
  readonly isTransparent = () => false;

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private subs = new Subscription();

  ngAfterViewInit(): void {
    // Détection page d'accueil pour l'état transparent du navbar
    this.isHome.set(this.router.url === '/' || this.router.url.startsWith('/?') || this.router.url.startsWith('/#'));

    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((ev) => {
          const url = (ev as NavigationEnd).urlAfterRedirects.split('?')[0].split('#')[0];
          this.isHome.set(url === '/' || url === '');
          this.closeMobile(); this.hovered.set(null); this.subitems.set([]);
        }),
    );
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ---- Mega-menu déroulant ----
  onEnter(item: NavItem): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
    this.hovered.set(item);
    this.translate.get(`nav.submenu.${item.key}`).subscribe(arr => {
      this.subitems.set(Array.isArray(arr) ? arr : []);
    });
  }
  keepOpen(): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
  }
  onLeave(): void {
    this.closeTimer = setTimeout(() => {
      this.hovered.set(null);
      this.subitems.set([]);
    }, 160);
  }

  /** Naviguer vers une ancre : va sur la page si nécessaire, puis scroll. */
  goToAnchor(link: string, anchor: string, ev?: Event): void {
    ev?.preventDefault();
    const doScroll = () => {
      const el = document.getElementById(anchor);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const currentUrl = this.router.url.split('#')[0].split('?')[0];
    if (currentUrl === link || (link === '/' && currentUrl === '/')) {
      doScroll();
    } else {
      this.router.navigate([link], { fragment: anchor }).then(() => {
        setTimeout(doScroll, 250);
      });
    }
    this.hovered.set(null);
    this.subitems.set([]);
    this.closeMobile();
  }

  // ---- Mobile ----
  setLang(l: Lang): void { if (this.lang.current() !== l) this.lang.use(l); }

  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
    this.lockBody(this.mobileOpen());
    if (this.mobileOpen()) {
      requestAnimationFrame(() => {
        gsap.fromTo('.mobile-menu__item',
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out', delay: 0.1 });
      });
    }
  }
  closeMobile(): void {
    if (this.mobileOpen()) { this.mobileOpen.set(false); this.lockBody(false); }
    this.mobileOpenItem.set(null);
  }
  toggleMobileItem(key: string): void {
    this.mobileOpenItem.update(cur => cur === key ? null : key);
  }
  private lockBody(lock: boolean): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = lock ? 'hidden' : '';
    }
  }

  submenuFor(key: string): SubItem[] {
    let list: SubItem[] = [];
    this.translate.get(`nav.submenu.${key}`).subscribe(arr => { if (Array.isArray(arr)) list = arr; });
    return list;
  }

  linkFor(key: string): string {
    return this.items.find(i => i.key === key)?.link ?? '/';
  }

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled.set(window.scrollY > 24); }
}
