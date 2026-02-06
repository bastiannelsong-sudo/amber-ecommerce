import { apiClient } from '../api-client';
import type { Product } from '../types';

export const productsService = {
  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
  },

  /**
   * Get a single product by ID
   */
  async getById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  /**
   * Get products with low stock
   */
  async getLowStock(threshold: number = 10): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products/low-stock', {
      params: { threshold },
    });
    return response.data;
  },

  /**
   * Get product history
   */
  async getHistory(id: number, limit: number = 50): Promise<any[]> {
    const response = await apiClient.get(`/products/${id}/history`, {
      params: { limit },
    });
    return response.data;
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
