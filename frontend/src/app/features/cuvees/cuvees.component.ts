import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cuvees',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './cuvees.component.html',
  styleUrl: './cuvees.component.scss',
})
export class CuveesComponent {
  /** Bouteille packshot propre, étiquette olivier visible. */
  bottleImage(slug: string): string {
    const map: Record<string, string> = {
      intense:  'assets/images/Noshuiles/int.jpg',
      balanced: 'assets/images/Noshuiles/bal.jpg',
      delicate: 'assets/images/Noshuiles/del.jpg',
    };
    return map[slug] ?? 'assets/images/Noshuiles/intrmv.png';
  }

  /** Photo lifestyle food photography pour la zone droite. */
  sceneImage(slug: string): string {
    const map: Record<string, string> = {
      intense:  'assets/images/Noshuiles/int.jpg',
      balanced: 'assets/images/Recettes/recetteMedium.png',
      delicate: 'assets/images/Recettes/recetteLegere.png',
    };
    return map[slug] ?? 'assets/images/Recettes/recetteIntense.png';
  }

  /** Image trio de bouteilles pour le hero. */
  readonly heroImage = 'assets/images/Noshuiles/Cuv.jpg';
}
