import type { Product } from '@/app/lib/types';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: {
    color: string;
    size?: string;
  };
}
