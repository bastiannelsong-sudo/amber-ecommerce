/**
 * Unit tests for catalog-api — search helpers and collections fetchers.
 *
 * Covers:
 * - sanitizeSearchQuery: trim, control-char stripping, max-length truncation
 * - searchProducts: delegates to fetch with sanitized q, returns empty on error
 * - fetchCollectionsTree: returns array on success, [] on error
 * - fetchCollectionBySlug: returns Collection on success, null on 404/error
 * - fetchCollectionProducts: returns products on success, empty on error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// server-only is mocked via vitest alias (vitest.config.mts)

const mockFetch = vi.fn();

describe('sanitizeSearchQuery', () => {
  let sanitizeSearchQuery: typeof import('./catalog-api').sanitizeSearchQuery;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockFetch);
    const mod = await import('./catalog-api');
    sanitizeSearchQuery = mod.sanitizeSearchQuery;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeSearchQuery('  collar  ')).toBe('collar');
  });

  it('strips ASCII control characters (0x00–0x1F)', () => {
    expect(sanitizeSearchQuery('collar\x00plata\x1F')).toBe('collarplata');
  });

  it('strips DEL character (0x7F)', () => {
    expect(sanitizeSearchQuery('test\x7Fvalue')).toBe('testvalue');
  });

  it('truncates to 200 characters', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeSearchQuery(long)).toHaveLength(200);
  });

  it('preserves normal alphanumeric and Spanish characters', () => {
    expect(sanitizeSearchQuery('anillo de plata 925')).toBe('anillo de plata 925');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeSearchQuery('')).toBe('');
  });

  it('strips control chars then trims (order matters)', () => {
    // \n (0x0A) is a control char and gets stripped; surrounding spaces are trimmed
    expect(sanitizeSearchQuery('  \ncolar  ')).toBe('colar');
  });
});

describe('searchProducts', () => {
  let searchProducts: typeof import('./catalog-api').searchProducts;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockFetch);
    const mod = await import('./catalog-api');
    searchProducts = mod.searchProducts;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('calls fetch with the sanitized q parameter', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: [], total: 0, page: 1, limit: 24, query: 'collar' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await searchProducts('  collar  ');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('q=collar');
    expect(url).not.toContain('q=++collar++');
  });

  it('strips control chars from q before forwarding to backend', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: [], total: 0, page: 1, limit: 24, query: 'collar' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await searchProducts('col\x00lar');

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('q=collar');
  });

  it('returns empty SearchResponse when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    const result = await searchProducts('collar');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.query).toBe('collar');
  });

  it('returns empty SearchResponse when backend returns non-ok status', async () => {
    mockFetch.mockResolvedValue(new Response('error', { status: 500 }));
    const result = await searchProducts('collar');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('normalizes backend category shape in returned products', async () => {
    const rawProduct = {
      product_id: 1,
      name: 'Test',
      category: { platform_id: 5, platform_name: 'Collares', description: null },
    };
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ data: [rawProduct], total: 1, page: 1, limit: 24, query: 'test' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await searchProducts('test');
    expect(result.data[0].category).toEqual({
      category_id: 5,
      name: 'Collares',
      description: null,
    });
  });

  it('forwards page and limit filters as query params', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: [], total: 0, page: 2, limit: 12, query: 'anillo' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await searchProducts('anillo', { page: 2, limit: 12 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('page=2');
    expect(url).toContain('limit=12');
  });
});

describe('fetchCollectionsTree', () => {
  let fetchCollectionsTree: typeof import('./catalog-api').fetchCollectionsTree;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockFetch);
    const mod = await import('./catalog-api');
    fetchCollectionsTree = mod.fetchCollectionsTree;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('returns the collections array from the backend', async () => {
    const tree = [{ id: 1, name: 'Proteccion', slug: 'proteccion', display_order: 1, is_active: true }];
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(tree), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    const result = await fetchCollectionsTree();
    expect(result).toEqual(tree);
  });

  it('returns [] when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    const result = await fetchCollectionsTree();
    expect(result).toEqual([]);
  });

  it('returns [] when backend returns non-ok status', async () => {
    mockFetch.mockResolvedValue(new Response('error', { status: 503 }));
    const result = await fetchCollectionsTree();
    expect(result).toEqual([]);
  });
});

describe('fetchCollectionBySlug', () => {
  let fetchCollectionBySlug: typeof import('./catalog-api').fetchCollectionBySlug;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockFetch);
    const mod = await import('./catalog-api');
    fetchCollectionBySlug = mod.fetchCollectionBySlug;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('returns the collection on 200', async () => {
    const col = { id: 1, name: 'Proteccion', slug: 'proteccion', display_order: 1, is_active: true };
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(col), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    const result = await fetchCollectionBySlug('proteccion');
    expect(result).toEqual(col);
  });

  it('returns null on 404', async () => {
    mockFetch.mockResolvedValue(new Response('not found', { status: 404 }));
    const result = await fetchCollectionBySlug('nonexistent');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    const result = await fetchCollectionBySlug('proteccion');
    expect(result).toBeNull();
  });

  it('URL-encodes the slug', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: 'Test', slug: 'test slug', display_order: 1, is_active: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await fetchCollectionBySlug('test slug');
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('test%20slug');
  });
});

describe('fetchCollectionProducts', () => {
  let fetchCollectionProducts: typeof import('./catalog-api').fetchCollectionProducts;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockFetch);
    const mod = await import('./catalog-api');
    fetchCollectionProducts = mod.fetchCollectionProducts;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('returns products and total on 200', async () => {
    const payload = { data: [{ product_id: 1, name: 'Ring' }], total: 1 };
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    const result = await fetchCollectionProducts('proteccion');
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('returns empty data on non-ok status', async () => {
    mockFetch.mockResolvedValue(new Response('error', { status: 500 }));
    const result = await fetchCollectionProducts('proteccion');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns empty data when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network'));
    const result = await fetchCollectionProducts('proteccion');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('appends limit and sort as query params', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: [], total: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    await fetchCollectionProducts('proteccion', { limit: 60, sort: 'bestseller' });
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('limit=60');
    expect(url).toContain('sort=bestseller');
  });

  it('URL-encodes the slug in the path', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: [], total: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    await fetchCollectionProducts('my collection');
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('my%20collection');
  });
});
