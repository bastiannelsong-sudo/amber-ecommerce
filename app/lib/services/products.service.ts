import { apiClient } from '../api-client';
import { dummyProducts, getDummyProductById } from '../data/dummy-products';
import type { Product, SearchResponse, SearchSuggestions } from '../types';

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
   * Get a single product by slug
   */
  async getBySlug(slug: string): Promise<Product> {
    try {
      const response = await apiClient.get(`/products/by-slug/${slug}`);
      return mapBackendProduct(response.data);
    } catch {
      // Fallback: try to extract ID from slug suffix (format: name-123)
      const idMatch = slug.match(/-(\d+)$/);
      if (idMatch) {
        return this.getById(Number(idMatch[1]));
      }
      throw new Error('Product not found');
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
  async getHistory(id: number, limit: number = 50): Promise<Record<string, unknown>[]> {
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
   * Search published products via backend API
   */
  async search(
    query: string,
    params: { page?: number; limit?: number; material?: string; style?: string; collection?: string; sort?: string } = {},
  ): Promise<SearchResponse> {
    try {
      const response = await apiClient.get('/products/ecommerce/search', {
        params: { q: query, ...params },
      });
      const res = response.data as SearchResponse;
      res.data = res.data.map(mapBackendProduct);
      return res;
    } catch {
      // Fallback: client-side filter
      const allProducts = await this.getAll();
      const q = query.toLowerCase();
      const filtered = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.internal_sku.toLowerCase().includes(q),
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

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string): Promise<SearchSuggestions> {
    try {
      const response = await apiClient.get('/products/ecommerce/suggestions', {
        params: { q: query },
      });
      return response.data as SearchSuggestions;
    } catch {
      return { products: [], collections: [] };
    }
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
