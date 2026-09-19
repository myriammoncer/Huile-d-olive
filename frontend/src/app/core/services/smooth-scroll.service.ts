import { Injectable } from '@angular/core';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Smooth scroll global (feel Pamako) via Lenis.
 * - Synchronise avec GSAP ScrollTrigger pour que tous les triggers restent fluides
 * - Respecte prefers-reduced-motion : fallback scroll natif
 * - Expose scrollTo pour les liens d'ancre / retour top
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private lenis: Lenis | null = null;
  private rafId: number | null = null;

  init(): void {
    if (typeof window === 'undefined') return;
    if (this.lenis) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    this.lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Sync ScrollTrigger avec Lenis (pattern officiel — une seule boucle via gsap.ticker)
    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(this.tickerCb);
    gsap.ticker.lagSmoothing(0);
  }

  /** Ticker callback stocké pour pouvoir le retirer proprement. */
  private tickerCb = (time: number) => {
    this.lenis?.raf(time * 1000);
  };

  /** Scroll vers une position ou un élément. */
  scrollTo(target: number | string | HTMLElement, options?: { offset?: number; immediate?: boolean }): void {
    if (!this.lenis) {
      if (typeof window !== 'undefined') {
        if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'auto' });
        else if (target instanceof HTMLElement) target.scrollIntoView({ behavior: 'auto', block: 'start' });
        else document.querySelector(target)?.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
      return;
    }
    this.lenis.scrollTo(target, {
      offset: options?.offset ?? 0,
      immediate: options?.immediate ?? false,
    });
  }

  /** Stop momentanément (utile pendant un modal / mobile menu). */
  stop(): void { this.lenis?.stop(); }
  start(): void { this.lenis?.start(); }

  destroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    gsap.ticker.remove(this.tickerCb);
    this.lenis?.destroy();
    this.lenis = null;
  }
}
