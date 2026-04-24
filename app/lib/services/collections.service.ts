import { apiClient } from '../api-client';
import type { Collection, Product, PaginatedResponse } from '../types';

export const collectionsService = {
  /**
   * Get full collection tree (universes → categories → subcategories)
   */
  async getTree(): Promise<Collection[]> {
    try {
      const response = await apiClient.get<Collection[]>('/collections/tree');
      return response.data;
    } catch {
      return [];
    }
  },

  /**
   * Get all collections (flat list)
   */
  async getAll(): Promise<Collection[]> {
    try {
      const response = await apiClient.get<Collection[]>('/collections');
      return response.data;
    } catch {
      return [];
    }
  },

  /**
   * Get a collection by slug
   */
  async getBySlug(slug: string): Promise<Collection | null> {
    try {
      const response = await apiClient.get<Collection>(`/collections/${slug}`);
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Get products for a collection by slug (paginated)
   */
  async getProducts(
    slug: string,
    page = 1,
    limit = 20,
    sort: 'bestseller' | 'newest' | 'price_asc' | 'price_desc' | 'name' = 'bestseller',
  ): Promise<PaginatedResponse<Product>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Product>>(
        `/collections/${slug}/products`,
        { params: { page, limit, sort } },
      );
      return response.data;
    } catch {
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  },
};
