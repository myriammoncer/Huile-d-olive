import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-professionals',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './professionals.component.html',
  styleUrl: './professionals.component.scss',
})
export class ProfessionalsComponent {
  /** Image bidon selon la taille. */
  formatImage(size: string): string {
    const map: Record<string, string> = {
      '3L': 'assets/images/Noshuiles/3Lrmv.png',
      '5L': 'assets/images/Noshuiles/5Lrmv.png',
    };
    return map[size] ?? 'assets/images/photos/bidon.jpg';
  }

  /** Photo hero avec les 2 bidons ensemble. */
  readonly heroImage = 'assets/images/photos/bidon.jpg';

  /** Photo lifestyle chef (offer section). */
  //readonly offerImage = 'assets/images/photos/proo.jpg';

  /** Photo partenaires / distributeurs. */
  readonly partnersImage = 'assets/images/photos/proo.jpg';
}
