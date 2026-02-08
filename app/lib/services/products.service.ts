import { apiClient } from '../api-client';
import { dummyProducts, getDummyProductById } from '../data/dummy-products';
import type { Product } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBackendProduct(raw: any): Product {
  return {
    ...raw,
    category: raw.category
      ? {
          category_id: raw.category.category_id ?? raw.category.platform_id,
          name: raw.category.name ?? raw.category.platform_name,
          description: raw.category.description,
        }
      : undefined,
  };
}

export const productsService = {
  /**
   * Get all products - falls back to dummy data if API is unavailable
   */
  async getAll(): Promise<Product[]> {
    try {
      const response = await apiClient.get('/products');
      return (response.data as any[]).map(mapBackendProduct);
    } catch {
      return dummyProducts;
    }
  },

  /**
   * Get a single product by ID - falls back to dummy data
   */
  async getById(id: number): Promise<Product> {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return mapBackendProduct(response.data);
    } catch {
      const product = getDummyProductById(id);
      if (!product) throw new Error('Product not found');
      return product;
    }
  },

  /**
   * Get products with low stock
   */
  async getLowStock(threshold: number = 10): Promise<Product[]> {
    try {
      const response = await apiClient.get('/products/low-stock', {
        params: { threshold },
      });
      return (response.data as any[]).map(mapBackendProduct);
    } catch {
      return dummyProducts.filter((p) => p.stock <= threshold);
    }
  },

  /**
   * Get product history
   */
  async getHistory(id: number, limit: number = 50): Promise<any[]> {
    try {
      const response = await apiClient.get(`/products/${id}/history`, {
        params: { limit },
      });
      return response.data;
    } catch {
      return [];
    }
  },

  /**
   * Search products by name or SKU
   */
  async search(query: string): Promise<Product[]> {
    const allProducts = await this.getAll();
    return allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.internal_sku.toLowerCase().includes(query.toLowerCase())
    );
  },

  /**
   * Filter products by category
   */
  async getByCategory(categoryId: number): Promise<Product[]> {
    const allProducts = await this.getAll();
    return allProducts.filter(
      (product) => product.category?.category_id === categoryId
    );
  },

  /**
   * Get featured/new products (products with newest stock updates)
   */
  async getFeatured(limit: number = 8): Promise<Product[]> {
    const allProducts = await this.getAll();
    return allProducts.slice(0, limit);
  },

  /**
   * Sort products by price
   */
  sortByPrice(products: Product[], order: 'asc' | 'desc' = 'asc'): Product[] {
    return [...products].sort((a, b) => {
      const priceA = a.price || 0;
      const priceB = b.price || 0;
      return order === 'asc' ? priceA - priceB : priceB - priceA;
    });
  },

  /**
   * Filter products by price range
   */
  filterByPriceRange(
    products: Product[],
    min: number,
    max: number
  ): Product[] {
    return products.filter((product) => {
      const price = product.price || 0;
      return price >= min && price <= max;
    });
  },
};
