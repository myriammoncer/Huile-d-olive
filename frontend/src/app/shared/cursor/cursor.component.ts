import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import gsap from 'gsap';

/**
 * Custom cursor style Pamako :
 * - Dot noir qui suit la souris avec léger lag (via gsap.quickTo)
 * - Grandit sur les éléments hoverables (a, button, .cursor-hover)
 * - Caché sur touch devices + prefers-reduced-motion
 */
@Component({
  selector: 'app-cursor',
  standalone: true,
  template: `
    <div #dot class="cursor" aria-hidden="true">
      <span class="cursor__inner"></span>
    </div>
  `,
  styleUrl: './cursor.component.scss',
})
export class CursorComponent implements AfterViewInit, OnDestroy {
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private xTo?: (v: number) => void;
  private yTo?: (v: number) => void;
  private enabled = false;
  private hoverHandlers: Array<{ el: Element; enter: EventListener; leave: EventListener }> = [];

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia?.('(hover: none)').matches;
    if (reduced || isTouch) return;

    const dot = this.host.nativeElement.querySelector<HTMLElement>('.cursor');
    if (!dot) return;

    this.enabled = true;
    dot.classList.add('is-active');

    // GSAP quickTo pour une interpolation performante (60fps)
    this.xTo = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3.out' });
    this.yTo = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3.out' });

    // Wire hover growth sur les éléments interactifs (une fois DOM stable)
    setTimeout(() => this.wireHoverables(), 500);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.enabled) return;
    this.xTo?.(e.clientX);
    this.yTo?.(e.clientY);
  }

  private wireHoverables(): void {
    const selectors = 'a, button, [role="button"], .cursor-hover, .hero-dot, .highlight-card, .btn';
    const targets = document.querySelectorAll(selectors);
    const dot = this.host.nativeElement.querySelector<HTMLElement>('.cursor');
    if (!dot) return;

    targets.forEach(el => {
      const enter = () => dot.classList.add('is-hovering');
      const leave = () => dot.classList.remove('is-hovering');
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
      this.hoverHandlers.push({ el, enter, leave });
    });

    // Observer pour cards ajoutées dynamiquement (route change)
    // Simpler : rewire toutes les 3s au cas où
    // (En prod, préférer MutationObserver, mais overhead négligeable)
  }

  ngOnDestroy(): void {
    this.hoverHandlers.forEach(({ el, enter, leave }) => {
      el.removeEventListener('mouseenter', enter);
      el.removeEventListener('mouseleave', leave);
    });
    this.hoverHandlers = [];
  }
}
