import type { MetadataRoute } from 'next';
import { dummyProducts } from './lib/data/dummy-products';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://amberjoyeria.cl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/catalogo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/colecciones`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/lookbook`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/sobre-nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/gift-card`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Fetch real products for slug-based URLs; fall back to dummy data
  let products = dummyProducts;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/products/ecommerce?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      products = json.data || json;
    }
  } catch {}

  const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: `${SITE_URL}/producto/${product.slug || product.product_id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
