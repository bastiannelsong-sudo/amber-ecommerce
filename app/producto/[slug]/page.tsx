import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import { fetchProductBySlug, fetchReviewSummary } from '@/app/lib/catalog-api';
import {
  PRODUCT_TYPE_COPY,
  SITE_URL,
  TAG_COPY,
  productTypeToSlug,
} from '@/app/lib/seo-copy';
import ProductClientUI from './ProductClientUI';

export const revalidate = 120;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function upgradeMLImage(url: string | null | undefined): string {
  if (!url) return '';
  return url.replace(/-O\.jpg$/, '-F.jpg');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) {
    return {
      title: 'Producto no encontrado | AMBER Joyas',
      description: 'El producto que buscas no existe o ya no está disponible.',
    };
  }

  const displayName = product.display_name || product.name;
  const url = `${SITE_URL}/producto/${product.slug || product.product_id}`;
  const image = upgradeMLImage(
    product.images?.[0] || product.image_url || '/placeholder-product.svg',
  );
  const priceLine = product.price
    ? `Desde $${Math.round(Number(product.price)).toLocaleString('es-CL')} CLP. `
    : '';
  const materialLine = product.material
    ? `${product.material.replace(/-/g, ' ')}. `
    : '';
  const description =
    (product.description?.trim().slice(0, 155)) ||
    `${priceLine}${materialLine}Envío a todo Chile. Cambios y devoluciones sin costo.`;

  return {
    title: `${displayName} | AMBER Joyas`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: displayName,
      description,
      url,
      siteName: 'AMBER Joyería',
      type: 'website',
      locale: 'es_CL',
      images: image ? [{ url: image, alt: displayName }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: displayName,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  // Review summary en paralelo — nullable si no hay reviews.
  const reviewSummary = await fetchReviewSummary(product.product_id);

  const displayName = product.display_name || product.name;
  const typeSlug = productTypeToSlug(product.product_type);
  const typeCopy = typeSlug ? PRODUCT_TYPE_COPY[typeSlug] : null;
  const productUrl = `${SITE_URL}/producto/${product.slug || product.product_id}`;
  const mainImage = upgradeMLImage(
    product.images?.[0] || product.image_url || '/placeholder-product.svg',
  );

  // JSON-LD: Breadcrumb
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      ...(typeSlug && typeCopy
        ? [
            { '@type': 'ListItem', position: 2, name: typeCopy.h1, item: `${SITE_URL}/${typeSlug}` },
            { '@type': 'ListItem', position: 3, name: displayName, item: productUrl },
          ]
        : [
            { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${SITE_URL}/catalogo` },
            { '@type': 'ListItem', position: 3, name: displayName, item: productUrl },
          ]),
    ],
  };

  // JSON-LD: Product (schema.org/Product). Google premia rich snippets
  // completos con shippingDetails + returnPolicy. Sin esos campos, Search
  // muestra solo precio sin badge de "envío gratis"/"devolución".
  // Ref: https://developers.google.com/search/docs/appearance/structured-data/product
  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayName,
    sku: product.internal_sku,
    url: productUrl,
    image: mainImage ? [mainImage] : undefined,
    description: product.description ?? undefined,
    brand: { '@type': 'Brand', name: 'AMBER Joyería' },
  };

  // Material (Plata 925, oro, etc.) — Google lo usa para "joyería".
  if (product.material) {
    productJsonLd.material = product.material.replace(/-/g, ' ');
  }
  // Categoría amplia para search engines.
  if (product.product_type) {
    productJsonLd.category = product.product_type;
  }

  if (product.price) {
    // priceValidUntil: requerido por Google para el snippet de precio.
    // 1 año hacia adelante — los precios casi nunca cambian más rápido.
    const priceValidUntil = new Date();
    priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

    productJsonLd.offers = {
      '@type': 'Offer',
      price: Number(product.price).toFixed(2),
      priceCurrency: 'CLP',
      priceValidUntil: priceValidUntil.toISOString().slice(0, 10),
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stock && product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: productUrl,
      seller: { '@type': 'Organization', name: 'AMBER Joyería' },

      // Envío: free shipping >$50.000 CLP, sino $5.000 flat. Cumple
      // requirements de Google para mostrar badge "envío gratis".
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: Number(product.price) > 50000 ? '0' : '5000',
          currency: 'CLP',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'CL',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },

      // Política de devolución: Ley del Consumidor CL — 10 días.
      // Sin esto, Google no muestra badge "devolución gratis".
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'CL',
        returnPolicyCategory:
          'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 10,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    };
  }
  if (reviewSummary) {
    productJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviewSummary.average_rating.toFixed(2),
      reviewCount: reviewSummary.total_reviews,
      bestRating: '5',
      worstRating: '1',
    };
  }

  const linkedTags = (product.tags ?? []).filter((t) => t in TAG_COPY);
  const hasExploreLinks = !!typeSlug || linkedTags.length > 0;

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Breadcrumb visible */}
      <nav className="container mx-auto px-4 lg:px-8 pt-4 sm:pt-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-xs text-platinum-500 overflow-x-auto whitespace-nowrap">
          <li>
            <Link href="/" className="hover:text-amber-gold-500 transition-colors">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">
            <span className="mx-1">/</span>
          </li>
          {typeSlug && typeCopy ? (
            <li>
              <Link href={`/${typeSlug}`} className="hover:text-amber-gold-500 transition-colors">
                {typeCopy.h1}
              </Link>
            </li>
          ) : (
            <li>
              <Link href="/catalogo" className="hover:text-amber-gold-500 transition-colors">
                Catálogo
              </Link>
            </li>
          )}
          <li aria-hidden="true">
            <span className="mx-1">/</span>
          </li>
          <li className="text-obsidian-700 truncate max-w-[200px]">{displayName}</li>
        </ol>
      </nav>

      {/* UI interactiva del producto (cart, zoom, gallery, reviews, accordion) */}
      <ProductClientUI product={product} />

      {/* Explora más — internal linking SEO server-rendered */}
      {hasExploreLinks && (
        <section
          className="container mx-auto px-4 lg:px-8 pb-10"
          aria-labelledby="explora-mas-title"
        >
          <div className="mt-16 sm:mt-24 border-t border-pearl-200/60 pt-10">
            <h2
              id="explora-mas-title"
              className="text-xs uppercase tracking-[0.2em] font-medium text-amber-gold-600 mb-5"
            >
              Explora más
            </h2>
            <div className="flex flex-wrap gap-2">
              {typeSlug && typeCopy && (
                <Link
                  href={`/${typeSlug}`}
                  className="rounded-full border border-pearl-300 bg-white px-4 py-2 text-xs font-medium tracking-wider text-obsidian-700 transition-colors hover:border-amber-gold-400 hover:bg-amber-gold-50 hover:text-amber-gold-700"
                >
                  Más {typeCopy.h1.toLowerCase()}
                </Link>
              )}
              {product.material && typeSlug && (
                <Link
                  href={`/${typeSlug}/${product.material}`}
                  className="rounded-full border border-pearl-300 bg-white px-4 py-2 text-xs font-medium tracking-wider text-obsidian-700 transition-colors hover:border-amber-gold-400 hover:bg-amber-gold-50 hover:text-amber-gold-700"
                >
                  {typeCopy?.h1} de {product.material.replace(/-/g, ' ')}
                </Link>
              )}
              {linkedTags.map((tag) => {
                const copy = TAG_COPY[tag];
                return (
                  <Link
                    key={tag}
                    href={`/amuletos/${tag}`}
                    className="rounded-full border border-pearl-300 bg-white px-4 py-2 text-xs font-medium tracking-wider text-obsidian-700 transition-colors hover:border-amber-gold-400 hover:bg-amber-gold-50 hover:text-amber-gold-700"
                  >
                    {copy.h1}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
