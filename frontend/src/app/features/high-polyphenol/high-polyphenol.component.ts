import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-high-polyphenol',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './high-polyphenol.component.html',
  styleUrl: './high-polyphenol.component.scss',
})
export class HighPolyphenolComponent {
  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cuveeImage(slug: string): string {
    const map: Record<string, string> = {
      intense:  'assets/images/Noshuiles/intrmvv.png',
      balanced: 'assets/images/Noshuiles/balrmvv.png',
      delicate: 'assets/images/Noshuiles/delrmvv.png',
    };
    return map[slug] ?? 'assets/images/Noshuiles/intensee.png';
  }
}
