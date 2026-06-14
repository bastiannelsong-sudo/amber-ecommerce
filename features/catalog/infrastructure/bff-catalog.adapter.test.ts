import { describe, it, expect, vi, beforeEach } from 'vitest';

// Partially mock @/app/lib/api-client — keep ApiError (real class) but replace
// apiClient.get with a spy. importOriginal preserves non-mocked exports.
vi.mock('@/app/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/lib/api-client')>();
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
    },
  };
});

import { apiClient, ApiError } from '@/app/lib/api-client';
import { bffCatalogAdapter } from './bff-catalog.adapter';

const mockGet = apiClient.get as ReturnType<typeof vi.fn>;

const bffPayload = {
  products: [
    { name: 'Collar Ambar', slug: 'collar-ambar', image_url: 'https://cdn.example.com/collar.jpg', price: 15990 },
  ],
  collections: [
    { name: 'Anillos', slug: 'anillos' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── bffCatalogAdapter.fetchSuggestions (CAT-I1) ─────────────────────────────

describe('bffCatalogAdapter.fetchSuggestions', () => {
  it('calls apiClient.get with /products/suggestions and query param', async () => {
    mockGet.mockResolvedValueOnce({ data: bffPayload, status: 200 });

    await bffCatalogAdapter.fetchSuggestions('collar');

    expect(mockGet).toHaveBeenCalledOnce();
    expect(mockGet).toHaveBeenCalledWith('/products/suggestions', {
      params: { q: 'collar' },
      signal: undefined,
    });
  });

  it('passes AbortSignal through to apiClient.get', async () => {
    mockGet.mockResolvedValueOnce({ data: bffPayload, status: 200 });
    const controller = new AbortController();

    await bffCatalogAdapter.fetchSuggestions('anillo', controller.signal);

    expect(mockGet).toHaveBeenCalledWith('/products/suggestions', {
      params: { q: 'anillo' },
      signal: controller.signal,
    });
  });

  it('returns a mapped SearchSuggestions domain value', async () => {
    mockGet.mockResolvedValueOnce({ data: bffPayload, status: 200 });

    const result = await bffCatalogAdapter.fetchSuggestions('collar');

    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({
      name: 'Collar Ambar',
      slug: 'collar-ambar',
      image_url: 'https://cdn.example.com/collar.jpg',
      price: 15990,
    });
    expect(result.collections).toHaveLength(1);
    expect(result.collections[0]).toMatchObject({ name: 'Anillos', slug: 'anillos' });
  });

  it('propagates BFF error as rejected Promise — NO dummy fallback', async () => {
    const error = new ApiError('Not Found', 404, null);
    mockGet.mockRejectedValueOnce(error);

    await expect(bffCatalogAdapter.fetchSuggestions('collar')).rejects.toThrow(ApiError);
  });

  it('propagates network error without swallowing it', async () => {
    mockGet.mockRejectedValueOnce(new Error('network failure'));

    await expect(bffCatalogAdapter.fetchSuggestions('collar')).rejects.toThrow('network failure');
  });
});
