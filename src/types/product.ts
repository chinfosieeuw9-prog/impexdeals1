export interface ProductImage {
  id: string;
  dataUrl?: string; // legacy base64
  url?: string;     // nieuwe geuploade URL
}

export interface Product {
  id: string;
  catalogCode?: string; // uniek kort nummer voor weergave
  title: string;
  category: string;
  price: number;
  qty: number;
  condition: string;
  description: string;
  images: ProductImage[];
  createdAt: number;
  isNew?: boolean;
  ownerId?: number;        // user id of owner (added later)
  ownerName?: string;      // denormalized username for quick display
  tags?: string[];
  location?: string;
  minOrder?: number;
  negotiable?: boolean;
  vatIncluded?: boolean;
  shippingMethods?: string[];
  expiresAt?: number; // timestamp
  brand?: string;
  isDraft?: boolean; // concept status
  externalLink?: string; // optionele externe referentie
}

export type NewProductInput = Omit<Product, 'id' | 'createdAt' | 'images' | 'isNew'> & { images: File[] | ProductImage[] };
