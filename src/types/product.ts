export type ProductType = 'simple' | 'variable';

export interface ProductAttribute {
  id: string;
  name: string; // e.g., "Couleur", "Taille"
  values: string[]; // e.g., ["Rouge", "Bleu", "Vert"]
  visible: boolean;
  variation: boolean; // Used for variations
}

export interface ProductVariant {
  id: string;
  attributes: Record<string, string>; // e.g., { "Couleur": "Rouge", "Taille": "M" }
  sku: string;
  price: number;
  stock?: number;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  type: ProductType;
  price: number;
  sku: string;
  mainImage?: string; // File URL (e.g., /uploads/image.jpg)
  galleryImages: string[]; // Array of file URLs
  attributes?: ProductAttribute[]; // Product attributes
  variants?: ProductVariant[];
  createdAt: Date;
}
