import {
  AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy, inject,
} from '@angular/core';

/**
 * [parallaxMouse] — décale et zoome légèrement l'élément selon la position de la souris
 * sur son PARENT (utile pour les images de hero, bouteilles flottantes).
 *
 * Usage : <div class="hero" parallaxMouse [parallaxDepth]="18"> <img …/> </div>
 * Cible : par défaut le premier <img> enfant, sinon l'élément lui-même.
 * S'auto-désactive si prefers-reduced-motion.
 */
@Directive({
  selector: '[parallaxMouse]',
  standalone: true,
})
export class ParallaxMouseDirective implements AfterViewInit, OnDestroy {
  private host: ElementRef<HTMLElement> = inject(ElementRef);

  /** Amplitude du déplacement en pixels (par défaut 20 px). */
  @Input() parallaxDepth = 20;
  /** Sélecteur cible dans le host (par défaut premier img). */
  @Input() parallaxTarget = 'img';
  /** Facteur de lissage. */
  @Input() parallaxSmooth = 0.12;
  /** Zoom léger sur cible (1 = aucun, 1.06 = +6%). */
  @Input() parallaxZoom = 1.04;

  private target: HTMLElement | null = null;
  private tx = 0; private ty = 0;
  private cx = 0; private cy = 0;
  private raf = 0;
  private reduce = false;
  private running = false;

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    if (this.reduce) return;

    const host = this.host.nativeElement;
    this.target = host.querySelector<HTMLElement>(this.parallaxTarget) ?? host;
    if (this.target) {
      this.target.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      this.target.style.willChange = 'transform';
    }
  }

  @HostListener('mousemove', ['$event'])
  onMove(ev: MouseEvent): void {
    if (this.reduce || !this.target) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / rect.width;
    const y = (ev.clientY - rect.top)  / rect.height;
    // Cible : décalage inverse (parallax) — bouge doucement dans le sens opposé
    this.tx = (x - 0.5) * -this.parallaxDepth;
    this.ty = (y - 0.5) * -this.parallaxDepth;
    if (!this.running) { this.running = true; this.loop(); }
  }

  @HostListener('mouseleave')
  onLeave(): void {
    if (this.reduce) return;
    this.tx = 0; this.ty = 0;
    if (!this.running) { this.running = true; this.loop(); }
  }

  private loop = (): void => {
    if (this.reduce || !this.target) { this.running = false; return; }
    this.cx += (this.tx - this.cx) * this.parallaxSmooth;
    this.cy += (this.ty - this.cy) * this.parallaxSmooth;
    this.target.style.transform =
      `translate3d(${this.cx.toFixed(2)}px, ${this.cy.toFixed(2)}px, 0) scale(${this.parallaxZoom})`;

    if (Math.abs(this.cx - this.tx) > 0.05 || Math.abs(this.cy - this.ty) > 0.05) {
      this.raf = requestAnimationFrame(this.loop);
    } else {
      this.running = false;
    }
  };

  ngOnDestroy(): void { if (this.raf) cancelAnimationFrame(this.raf); }
}
