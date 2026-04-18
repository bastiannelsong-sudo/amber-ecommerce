import type { Metadata } from 'next';
import { productsService } from '@/app/lib/services/products.service';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

async function getProduct(slug: string) {
  try {
    const isNumeric = /^\d+$/.test(slug);
    return isNumeric
      ? await productsService.getById(Number(slug))
      : await productsService.getBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Producto no encontrado | Amber Joyeria',
    };
  }

  const name = product.display_name || product.name;
  const description = product.description
    || `${name} - Joyeria con cambios sin costo. Envio gratuito sobre $50.000.`;
  const priceText = product.price ? ` $${Math.round(Number(product.price)).toLocaleString('es-CL')}` : '';
  const imageUrl = product.image_url || '/logo_claro.png';
  const productSlug = product.slug || slug;

  return {
    title: `${name} | Amber Joyeria`,
    description: `${description}${priceText}`,
    openGraph: {
      title: `${name} | Amber Joyeria`,
      description: `${description}${priceText}`,
      url: `/producto/${productSlug}`,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | Amber Joyeria`,
      description: `${description}${priceText}`,
      images: [imageUrl],
    },
    alternates: {
      canonical: `/producto/${productSlug}`,
    },
    other: {
      'product:price:amount': product.price ? String(product.price) : '',
      'product:price:currency': 'CLP',
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
      'product:brand': 'Amber',
      ...(product.material && { 'product:material': product.material }),
    },
  };
}

export default async function ProductoLayout({ params, children }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  const name = product?.display_name || product?.name;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amberjoyeria.cl';
  const productSlug = product?.slug || slug;

  // Product JSON-LD
  const productJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        image: product.images?.length
          ? product.images
          : [product.image_url],
        description: product.description
          || `${name} - Joyeria premium con acabado de alta durabilidad.`,
        sku: product.internal_sku,
        brand: {
          '@type': 'Brand',
          name: 'Amber',
        },
        ...(product.material && { material: product.material }),
        offers: {
          '@type': 'Offer',
          url: `${siteUrl}/producto/${productSlug}`,
          priceCurrency: 'CLP',
          price: product.price,
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          availability: product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'Amber Joyeria',
          },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'CL',
            },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1, unitCode: 'DAY' },
              transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
            },
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'CL',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 30,
            returnMethod: 'https://schema.org/ReturnByMail',
          },
        },
        category: product.category?.name || 'Joyeria',
      }
    : null;

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Catalogo',
        item: `${siteUrl}/catalogo`,
      },
      ...(product?.category?.name
        ? [{
            '@type': 'ListItem',
            position: 3,
            name: product.category.name,
            item: `${siteUrl}/catalogo?categoria=${product.category.category_id}`,
          }]
        : []),
      ...(name
        ? [{
            '@type': 'ListItem',
            position: product?.category?.name ? 4 : 3,
            name,
            item: `${siteUrl}/producto/${productSlug}`,
          }]
        : []),
    ],
  };

  // FAQ JSON-LD for accordion sections
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Cuales son los detalles del producto ${name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${name} es una pieza de joyeria premium de AMBER${product?.material ? `, fabricada en ${product.material}` : ''}. Incluye cambios sin costo y empaque premium de regalo.`,
        },
      },
      {
        '@type': 'Question',
        name: '¿Como debo cuidar mi joya AMBER?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Para mantener tu joya en optimas condiciones: evita el contacto con perfumes, cremas y agua. Guardala en bolsa individual o caja cerrada. Limpia con pano suave y seco. Retirala antes de dormir o hacer ejercicio.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cual es la politica de envio y devoluciones de AMBER?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Envio gratis en compras sobre $50.000 CLP. Despacho en 1-3 dias habiles a todo Chile. 30 dias para cambios y devoluciones.',
        },
      },
    ],
  };

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
