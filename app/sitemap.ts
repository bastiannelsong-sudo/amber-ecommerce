import type { MetadataRoute } from 'next';
import { dummyProducts } from './lib/data/dummy-products';
import { PRODUCT_TYPE_SLUGS, TYPE_MATERIAL_COMBOS, getSupportedTagSlugs } from './lib/seo-copy';

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
  ];

  // Fetch real products for slug-based URLs; fall back to dummy data
  let products = dummyProducts;
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL || 'http://localhost:3000'}/products/ecommerce?limit=500`, {
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

  // Landings SEO por tipo de producto (/pulseras, /collares, /aros…)
  const typePages: MetadataRoute.Sitemap = PRODUCT_TYPE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // Rutas anidadas tipo × material (/pulseras/plata-925, /collares/acero…)
  const typeMaterialPages: MetadataRoute.Sitemap = TYPE_MATERIAL_COMBOS.map((c) => ({
    url: `${SITE_URL}/${c.type}/${c.material}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }));

  // Landings SEO por símbolo/intención (/amuletos/san-benito, /amuletos/hilo-rojo…)
  const tagPages: MetadataRoute.Sitemap = getSupportedTagSlugs().map((tag) => ({
    url: `${SITE_URL}/amuletos/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...typePages, ...typeMaterialPages, ...tagPages, ...productPages];
}
