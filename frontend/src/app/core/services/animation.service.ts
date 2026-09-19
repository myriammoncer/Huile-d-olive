import { Injectable } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Helpers GSAP + ScrollTrigger réutilisables entre pages.
 * Chaque méthode retourne le tween pour permettre au caller de tracker et kill.
 */
@Injectable({ providedIn: 'root' })
export class AnimationService {

  private readonly reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  fadeInUp(selector: string | Element | Element[], trigger?: string | Element, delay = 0) {
    if (this.reducedMotion) return;
    return gsap.from(selector, {
      scrollTrigger: { trigger: (trigger ?? selector) as any, start: 'top 85%', once: true },
      y: 60, opacity: 0, duration: 0.8, delay, ease: 'power3.out',
    });
  }

  fadeInLeft(selector: string | Element, trigger?: string | Element) {
    if (this.reducedMotion) return;
    return gsap.from(selector, {
      scrollTrigger: { trigger: (trigger ?? selector) as any, start: 'top 85%', once: true },
      x: -80, opacity: 0, duration: 0.8, ease: 'power3.out',
    });
  }

  fadeInRight(selector: string | Element, trigger?: string | Element) {
    if (this.reducedMotion) return;
    return gsap.from(selector, {
      scrollTrigger: { trigger: (trigger ?? selector) as any, start: 'top 85%', once: true },
      x: 80, opacity: 0, duration: 0.8, ease: 'power3.out',
    });
  }

  scaleReveal(selector: string | Element, trigger?: string | Element) {
    if (this.reducedMotion) return;
    return gsap.from(selector, {
      scrollTrigger: { trigger: (trigger ?? selector) as any, start: 'top 85%', once: true },
      scale: 0.85, opacity: 0, duration: 1, ease: 'power3.out',
    });
  }

  staggerIn(selector: string | Element[], trigger: string | Element, staggerDelay = 0.15) {
    if (this.reducedMotion) return;
    return gsap.from(selector, {
      scrollTrigger: { trigger: trigger as any, start: 'top 80%', once: true },
      y: 50, opacity: 0, duration: 0.7, stagger: staggerDelay, ease: 'power3.out',
    });
  }

  animateCounter(element: HTMLElement, target: number, duration = 2, formatter?: (n: number) => string) {
    if (this.reducedMotion) {
      element.textContent = formatter ? formatter(target) : Math.round(target).toLocaleString('fr-FR');
      return;
    }
    const obj = { value: 0 };
    return gsap.to(obj, {
      value: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        element.textContent = formatter
          ? formatter(obj.value)
          : Math.round(obj.value).toLocaleString('fr-FR');
      },
      scrollTrigger: { trigger: element, start: 'top 85%', once: true },
    });
  }

  parallax(selector: string | Element, speed = 0.3) {
    if (this.reducedMotion) return;
    return gsap.to(selector, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: selector as any,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  clipReveal(selector: string | Element, trigger?: string | Element) {
    if (this.reducedMotion) return;
    return gsap.from(selector, {
      scrollTrigger: { trigger: (trigger ?? selector) as any, start: 'top 80%', once: true },
      clipPath: 'inset(100% 0% 0% 0%)',
      duration: 1.2, ease: 'power4.out',
    });
  }

  lineReveal(selector: string | Element) {
    if (this.reducedMotion) return;
    return gsap.from(selector, {
      scrollTrigger: { trigger: selector as any, start: 'top 90%', once: true },
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1,
      ease: 'power3.out',
    });
  }

  refresh(): void {
    setTimeout(() => ScrollTrigger.refresh(), 100);
  }

  /** Tue tous les ScrollTriggers dont le trigger est descendant de root. */
  killIn(root: HTMLElement): void {
    ScrollTrigger.getAll().forEach(t => {
      const trg = t.trigger as HTMLElement | undefined;
      if (trg && root.contains(trg)) t.kill();
    });
  }

  killAll(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}
