import { describe, it, expect } from 'vitest';
import { mapSuggestions } from './catalog.mapper';
import type { SearchSuggestions } from '@/features/catalog/domain/catalog.types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const bffProduct = {
  product_id: 1,
  name: 'Collar Ambar',
  slug: 'collar-ambar',
  image_url: 'https://cdn.example.com/collar.jpg',
  price: 15990,
};

const bffCollection = {
  name: 'Anillos',
  slug: 'anillos',
};

// ─── mapSuggestions (CAT-A2) ──────────────────────────────────────────────────

describe('mapSuggestions', () => {
  it('maps a non-empty BFF response to SearchSuggestions shape', () => {
    const raw = {
      products: [bffProduct],
      collections: [bffCollection],
    };

    const result: SearchSuggestions = mapSuggestions(raw);

    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({
      name: 'Collar Ambar',
      slug: 'collar-ambar',
      image_url: 'https://cdn.example.com/collar.jpg',
      price: 15990,
    });
    expect(result.collections).toHaveLength(1);
    expect(result.collections[0]).toMatchObject({
      name: 'Anillos',
      slug: 'anillos',
    });
  });

  it('maps an empty BFF response to empty products and collections arrays', () => {
    const raw = { products: [], collections: [] };
    const result = mapSuggestions(raw);
    expect(result.products).toEqual([]);
    expect(result.collections).toEqual([]);
  });

  it('collections do NOT include image_url (shape: { name, slug } only)', () => {
    const rawWithImageInCollection = {
      products: [],
      collections: [{ name: 'Anillos', slug: 'anillos', image_url: 'should-not-appear.jpg' }],
    };
    const result = mapSuggestions(rawWithImageInCollection);
    const col = result.collections[0] as Record<string, unknown>;
    expect(col.image_url).toBeUndefined();
  });

  it('products include image_url and price fields', () => {
    const raw = { products: [bffProduct], collections: [] };
    const result = mapSuggestions(raw);
    expect(result.products[0].image_url).toBe('https://cdn.example.com/collar.jpg');
    expect(result.products[0].price).toBe(15990);
  });
});
