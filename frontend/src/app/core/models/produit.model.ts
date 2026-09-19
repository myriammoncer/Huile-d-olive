// Modèle Produit — reflète le schéma bilingue de la table `produits`.
export type Gamme = 'intense' | 'balanced' | 'delicate' | 'hp';

export interface Produit {
  id: number;
  slug: string;
  nom_fr: string;
  nom_en: string;
  subtitle_fr?: string;
  subtitle_en?: string;
  lead_short_fr?: string;
  lead_short_en?: string;
  description_fr?: string;
  description_en?: string;
  harvest_fr?: string;
  harvest_en?: string;
  profil_aromatique_fr?: string;
  profil_aromatique_en?: string;
  suggestions_fr?: string;
  suggestions_en?: string;
  variete?: string;
  gamme?: Gamme | string;
  format?: string;
  image_url?: string;
  image_public_id?: string;
  accent_color?: string;
  actif?: boolean | number;
  created_at?: string;
}

export interface Message {
  nom: string;
  email: string;
  sujet?: string;
  message: string;
}
