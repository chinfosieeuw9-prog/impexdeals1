import React from 'react';
import { Product } from '../types/product';

interface StructuredDataProps { product: Product; }

// Inject Product schema.org structured data for SEO
const StructuredData: React.FC<StructuredDataProps> = ({ product }) => {
  if (!product) return null;
  const firstImg = product.images?.[0]?.dataUrl;
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description?.slice(0, 500),
    category: product.category,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: product.price,
      availability: product.qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
  };
  if (firstImg) data.image = [firstImg];
  if (product.brand) data.brand = { '@type': 'Brand', name: product.brand };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
};
export default StructuredData;
