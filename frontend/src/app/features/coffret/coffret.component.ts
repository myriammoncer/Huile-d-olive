import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-coffret',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './coffret.component.html',
  styleUrl: './coffret.component.scss',
})
export class CoffretComponent {
  /** Grande photo hero (les 3 coffrets ensemble). */
  readonly heroImage = 'assets/images/accueil/cadeau.jpg';

  /** Photo lifestyle par slug de coffret. */
  coffretImage(slug: string): string {
    const map: Record<string, string> = {
      signature: 'assets/images/photos/coffvert.png',
      curubis:   'assets/images/photos/coffrouge.png',
      neapolis:  'assets/images/photos/coffbleu.jpg',
    };
    return map[slug] ?? map['signature'];
  }
}
