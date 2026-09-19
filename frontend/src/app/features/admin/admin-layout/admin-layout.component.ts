import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminStateService } from '../../../core/services/admin-state.service';
import { ToastsComponent } from '../../../shared/toasts/toasts.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ToastsComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly state = inject(AdminStateService);

  readonly user = this.auth.user;

  ngOnInit(): void {
    this.state.refreshUnread();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
