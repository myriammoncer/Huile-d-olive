import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-traceability',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './traceability.component.html',
  styleUrl: './traceability.component.scss',
})
export class TraceabilityComponent {
  /** Image lifestyle par carte d'engagement. */
  readonly engagementImages: string[] = [
    'assets/images/Notre_Hist/section_vision.jpg',   // Eau de pluie / branche olivier
    'assets/images/Tracabilite/carteducru.png',       // Sans pesticides / mains + terre
    'assets/images/photos/pro2.jpeg',                  // Femmes de notre village
    'assets/images/Recettes/recetteIntense.png',      // Excellence au quotidien / huile
  ];
}
