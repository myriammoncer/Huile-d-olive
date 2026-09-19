import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Routing — lazy-loading par page (standalone components).
 * v2 (juillet 2026) : renommages selon doc de contenu final.
 *  - /nos-huiles         → /nos-cuvees (+ fiche dynamique :slug)
 *  - /ultra-polyphenols  → /high-polyphenol
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    data: { titleKey: 'nav.home', page: 'accueil' },
  },
  {
    path: 'notre-histoire',
    loadComponent: () => import('./features/history/history.component').then(m => m.HistoryComponent),
    data: { titleKey: 'nav.history', page: 'notre-histoire' },
  },
  {
    path: 'high-polyphenol',
    loadComponent: () => import('./features/high-polyphenol/high-polyphenol.component').then(m => m.HighPolyphenolComponent),
    data: { titleKey: 'nav.hp', page: 'high-polyphenol' },
  },
  // Redirection legacy
  { path: 'ultra-polyphenols', redirectTo: 'high-polyphenol', pathMatch: 'full' },

  {
    path: 'nos-cuvees',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/cuvees/cuvees.component').then(m => m.CuveesComponent),
        data: { titleKey: 'nav.cuvees', page: 'nos-cuvees' },
      },
      {
        path: ':slug',
        loadComponent: () =>
          import('./features/cuvees/cuvee-detail/cuvee-detail.component').then(m => m.CuveeDetailComponent),
        data: { titleKey: 'nav.cuvees', page: 'nos-cuvees-detail' },
      },
    ],
  },
  // Redirection legacy
  { path: 'nos-huiles', redirectTo: 'nos-cuvees', pathMatch: 'full' },
  // Coffrets Cadeaux — page dédiée à créer (mockup 7). Pour l'instant redirige vers l'ancre existante.
  { path: 'coffrets',   redirectTo: 'nos-cuvees#coffrets', pathMatch: 'full' },

  {
    path: 'tracabilite',
    loadComponent: () => import('./features/traceability/traceability.component').then(m => m.TraceabilityComponent),
    data: { titleKey: 'nav.traceability', page: 'tracabilite' },
  },
  {
    path: 'coffret-cadeau',
    loadComponent: () => import('./features/coffret/coffret.component').then(m => m.CoffretComponent),
    data: { titleKey: 'nav.coffret', page: 'coffret-cadeau' },
  },
  // Legacy : la page recettes a été supprimée, redirige vers la home.
  { path: 'recettes', redirectTo: '', pathMatch: 'full' },
  {
    path: 'professionnels',
    loadComponent: () => import('./features/professionals/professionals.component').then(m => m.ProfessionalsComponent),
    data: { titleKey: 'nav.pro', page: 'professionnels' },
  },
  {
    path: 'private-label',
    loadComponent: () => import('./features/private-label/private-label.component').then(m => m.PrivateLabelComponent),
    data: { titleKey: 'nav.pl', page: 'private-label' },
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
    data: { titleKey: 'nav.contact', page: 'contact' },
  },

  // ===================== ADMIN =====================
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/admin/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'produits' },
          { path: 'produits', loadComponent: () => import('./features/admin/products/products.component').then(m => m.ProductsComponent) },
          { path: 'messages', loadComponent: () => import('./features/admin/messages/messages.component').then(m => m.MessagesComponent) },
          { path: 'statistiques', loadComponent: () => import('./features/admin/stats/stats.component').then(m => m.StatsComponent) },
        ],
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
