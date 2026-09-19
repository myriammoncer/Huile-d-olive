import {
  AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy, inject,
} from '@angular/core';

/**
 * [tilt3d] — inclinaison 3D basée sur la position de la souris.
 * Ajoute perspective + rotateX/Y + halo lumineux qui suit le curseur.
 *
 * Usage : <div tilt3d [tiltMax]="10" [tiltGlow]="true">…</div>
 * S'auto-désactive si prefers-reduced-motion.
 */
@Directive({
  selector: '[tilt3d]',
  standalone: true,
})
export class Tilt3dDirective implements AfterViewInit, OnDestroy {
  private el: ElementRef<HTMLElement> = inject(ElementRef);

  /** Inclinaison max en degrés (par défaut 10°). */
  @Input() tiltMax = 10;
  /** Effet lift en px au survol (parallaxe Z). */
  @Input() tiltLift = 12;
  /** Halo lumineux qui suit le curseur. */
  @Input() tiltGlow = true;
  /** Facteur de lissage (0.15 = souple, 0.3 = réactif). */
  @Input() tiltSmooth = 0.18;

  private rx = 0;
  private ry = 0;
  private tx = 0;
  private ty = 0;
  private hovering = false;
  private raf = 0;
  private reduce = false;

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    if (this.reduce) return;

    const host = this.el.nativeElement;
    host.style.transformStyle = 'preserve-3d';
    host.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
    host.style.willChange = 'transform';

    if (this.tiltGlow) {
      const glow = document.createElement('span');
      glow.className = 'tilt3d__glow';
      Object.assign(glow.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        background: 'radial-gradient(220px circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.22), transparent 60%)',
        opacity: '0',
        transition: 'opacity 0.35s ease',
        borderRadius: 'inherit',
        mixBlendMode: 'soft-light',
        zIndex: '2',
      } as CSSStyleDeclaration);
      // Assure que le parent est positionné
      const pos = getComputedStyle(host).position;
      if (pos === 'static') host.style.position = 'relative';
      host.appendChild(glow);
    }
  }

  @HostListener('mouseenter')
  onEnter(): void {
    if (this.reduce) return;
    this.hovering = true;
    this.loop();
    const glow = this.el.nativeElement.querySelector<HTMLElement>('.tilt3d__glow');
    if (glow) glow.style.opacity = '1';
  }

  @HostListener('mousemove', ['$event'])
  onMove(ev: MouseEvent): void {
    if (this.reduce || !this.hovering) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / rect.width;   // 0 → 1
    const y = (ev.clientY - rect.top)  / rect.height;  // 0 → 1

    // Cible : rotateY dépend de X, rotateX dépend de Y (inversé)
    this.tx = (x - 0.5) *  this.tiltMax * 2;
    this.ty = (0.5 - y) *  this.tiltMax * 2;

    const glow = this.el.nativeElement.querySelector<HTMLElement>('.tilt3d__glow');
    if (glow) {
      glow.style.setProperty('--gx', (x * 100) + '%');
      glow.style.setProperty('--gy', (y * 100) + '%');
    }
  }

  @HostListener('mouseleave')
  onLeave(): void {
    if (this.reduce) return;
    this.hovering = false;
    this.tx = 0;
    this.ty = 0;
    const glow = this.el.nativeElement.querySelector<HTMLElement>('.tilt3d__glow');
    if (glow) glow.style.opacity = '0';
  }

  /** Boucle rAF pour lisser le tilt. */
  private loop = (): void => {
    if (this.reduce) return;
    this.rx += (this.ty - this.rx) * this.tiltSmooth;
    this.ry += (this.tx - this.ry) * this.tiltSmooth;
    const host = this.el.nativeElement;
    const lift = this.hovering ? this.tiltLift : 0;
    host.style.transform =
      `perspective(1000px) translateZ(${lift}px) rotateX(${this.rx.toFixed(2)}deg) rotateY(${this.ry.toFixed(2)}deg)`;

    // Continue tant qu'il y a un mouvement ou qu'on survole
    if (this.hovering || Math.abs(this.rx) > 0.05 || Math.abs(this.ry) > 0.05) {
      this.raf = requestAnimationFrame(this.loop);
    } else {
      host.style.transform = '';
    }
  };

  ngOnDestroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}
