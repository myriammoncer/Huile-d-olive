import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-private-label',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './private-label.component.html',
  styleUrl: './private-label.component.scss',
})
export class PrivateLabelComponent {
  /** Photo hero — bouteille prête à être customisée. */
  readonly heroImage = 'assets/images/Noshuiles/PLrmvv.png';
}
