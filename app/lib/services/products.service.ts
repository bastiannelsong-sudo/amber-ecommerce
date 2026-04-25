import { apiClient } from '../api-client';
import { dummyProducts, getDummyProductById } from '../data/dummy-products';
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
    try {
      const response = await apiClient.get<Array<Record<string, unknown>>>('/products');
      return response.data.map(mapBackendProduct);
    } catch {
      return dummyProducts;
    }
  },

  async getById(id: number): Promise<Product> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(`/products/${id}`);
      return mapBackendProduct(response.data);
    } catch {
      const product = getDummyProductById(id);
      if (!product) throw new Error('Product not found');
      return product;
    }
  },

  async getBySlug(slug: string): Promise<Product> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        `/products/by-slug/${slug}`,
      );
      return mapBackendProduct(response.data);
    } catch {
      const idMatch = slug.match(/-(\d+)$/);
      if (idMatch) {
        return this.getById(Number(idMatch[1]));
      }
      throw new Error('Product not found');
    }
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
    try {
      const response = await apiClient.get<SearchResponse>('/products/search', {
        params: { q: query, ...params },
      });
      const res = response.data;
      res.data = res.data.map(mapBackendProduct);
      return res;
    } catch {
      const allProducts = await this.getAll();
      const q = query.toLowerCase();
      const filtered = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.internal_sku.toLowerCase().includes(q),
      );
      return {
        data: filtered.slice(0, params.limit || 20),
        total: filtered.length,
        page: params.page || 1,
        limit: params.limit || 20,
        query,
      };
    }
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
