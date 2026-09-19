import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Produit } from '../../../core/models/produit.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  readonly produits = signal<Produit[]>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly uploading = signal(false);
  readonly saving = signal(false);

  readonly gammes = ['intense', 'balanced', 'delicate', 'hp'];
  readonly formats = ['500 ml', '50cl', '3L', '5L', 'coffret'];

  readonly form = this.fb.group({
    slug: [''],
    nom_fr: ['', Validators.required],
    nom_en: [''],
    subtitle_fr: [''],
    subtitle_en: [''],
    lead_short_fr: [''],
    lead_short_en: [''],
    description_fr: [''],
    description_en: [''],
    harvest_fr: [''],
    harvest_en: [''],
    profil_aromatique_fr: [''],
    profil_aromatique_en: [''],
    suggestions_fr: [''],
    suggestions_en: [''],
    variete: [''],
    gamme: [''],
    format: [''],
    accent_color: ['#A56E31'],
    image_url: [''],
    actif: [true],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    // Admin voit tout : actifs + inactifs
    this.api.getProduitsAll().subscribe({
      next: (rows) => { this.produits.set(rows); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Chargement des produits impossible.'); },
    });
  }

  newProduct(): void {
    this.editingId.set(null);
    this.form.reset({ accent_color: '#A56E31', actif: true });
    this.showForm.set(true);
  }

  edit(p: Produit): void {
    this.editingId.set(p.id);
    this.form.patchValue({
      ...p,
      actif: p.actif === undefined ? true : !!p.actif,
    });
    this.showForm.set(true);
  }

  cancel(): void { this.showForm.set(false); this.editingId.set(null); }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.api.uploadImage(file).subscribe({
      next: (res) => { this.form.patchValue({ image_url: res.url }); this.uploading.set(false); },
      error: () => { this.uploading.set(false); this.toast.error("Échec de l'upload de l'image."); },
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload = this.form.value as Partial<Produit>;
    const id = this.editingId();

    const req = id
      ? this.api.updateProduit(id, payload)
      : this.api.createProduit(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toast.success(id ? 'Produit modifié.' : 'Produit ajouté.');
        this.load();
      },
      error: () => { this.saving.set(false); this.toast.error('Enregistrement impossible.'); },
    });
  }

  remove(p: Produit): void {
    if (!confirm(`Supprimer « ${p.nom_fr} » ?`)) return;
    this.api.deleteProduit(p.id).subscribe({
      next: () => { this.toast.success('Produit supprimé.'); this.load(); },
      error: () => this.toast.error('Suppression impossible.'),
    });
  }

}
