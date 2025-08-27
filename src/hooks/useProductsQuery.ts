import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../services/productService';

// Cache key constant to avoid typos
export const productsKey = ['products'];

export function useProductsQuery() {
  return useQuery({
    queryKey: productsKey,
    queryFn: async () => {
      // Simuleer async (later echte fetch)
      await new Promise(r=>setTimeout(r,400));
      return getProducts();
    },
    staleTime: 30_000,
  });
}
