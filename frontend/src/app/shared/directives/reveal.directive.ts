import {
  AfterViewInit, Directive, ElementRef, Input, OnDestroy, inject,
} from '@angular/core';

/**
 * revealOnScroll — apparition élégante (fade-in + slide-up) à l'entrée
 * dans le viewport, via IntersectionObserver (léger, sans dépendance).
 *
 * Usage :  <section appReveal>…</section>
 *          <div appReveal [revealDelay]="120">…</div>   (délai en ms)
 *
 * Respecte prefers-reduced-motion (révèle immédiatement, sans animation).
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
  host: { class: 'reveal-on-scroll' },
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);

  /** Délai d'apparition (ms) — utile pour des effets en cascade. */
  @Input() revealDelay = 0;

  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    if (this.revealDelay) node.style.transitionDelay = `${this.revealDelay}ms`;

    const reduce = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-revealed');
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          this.observer?.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    this.observer.observe(node);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}
