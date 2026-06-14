import { apiClient } from '../api-client';
import type { Product, SearchResponse, SearchSuggestions } from '../types';

/**
 * Servicios de productos desde el browser — apuntan al BFF /api/products/*.
 * El backend NestJS (subnet privada) NUNCA es accesible desde este módulo.
 */

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
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get<Array<Record<string, unknown>>>('/products');
    return response.data.map(mapBackendProduct);
  },

  async getById(id: number): Promise<Product> {
    const response = await apiClient.get<Record<string, unknown>>(`/products/${id}`);
    return mapBackendProduct(response.data);
  },

  async getBySlug(slug: string): Promise<Product> {
    const response = await apiClient.get<Record<string, unknown>>(
      `/products/by-slug/${slug}`,
    );
    return mapBackendProduct(response.data);
  },

  async search(
    query: string,
    params: {
      page?: number;
      limit?: number;
      material?: string;
      style?: string;
      collection?: string;
      sort?: string;
    } = {},
  ): Promise<SearchResponse> {
    const response = await apiClient.get<SearchResponse>('/products/search', {
      params: { q: query, ...params },
    });
    const res = response.data;
    res.data = res.data.map(mapBackendProduct);
    return res;
  },

  async getSuggestions(query: string): Promise<SearchSuggestions> {
    try {
      const response = await apiClient.get<SearchSuggestions>('/products/suggestions', {
        params: { q: query },
      });
      return response.data;
    } catch {
      return { products: [], collections: [] };
    }
  },

  async getByCategory(categoryId: number): Promise<Product[]> {
    const allProducts = await this.getAll();
    return allProducts.filter((product) => product.category?.category_id === categoryId);
  },

  async getFeatured(limit: number = 8): Promise<Product[]> {
    const allProducts = await this.getAll();
    return allProducts.slice(0, limit);
  },

  sortByPrice(products: Product[], order: 'asc' | 'desc' = 'asc'): Product[] {
    return [...products].sort((a, b) => {
      const priceA = a.price || 0;
      const priceB = b.price || 0;
      return order === 'asc' ? priceA - priceB : priceB - priceA;
    });
  },

  filterByPriceRange(products: Product[], min: number, max: number): Product[] {
    return products.filter((product) => {
      const price = product.price || 0;
      return price >= min && price <= max;
    });
  },
};
