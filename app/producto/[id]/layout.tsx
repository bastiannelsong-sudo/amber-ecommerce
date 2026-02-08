import type { Metadata } from 'next';
import { getDummyProductById, dummyProducts } from '@/app/lib/data/dummy-products';
import { productsService } from '@/app/lib/services/products.service';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

async function getProduct(id: number) {
  try {
    return await productsService.getById(id);
  } catch {
    return getDummyProductById(id) || null;
  }
}

export async function generateStaticParams() {
  return dummyProducts.map((product) => ({
    id: String(product.product_id),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(parseInt(id));

  if (!product) {
    return {
      title: 'Producto no encontrado',
    };
  }

  const title = product.name;
  const description = `${product.name} - Plata 925 con garantia 12 meses. Envio gratuito sobre $30.000. $${product.price?.toLocaleString('es-CL')}`;
  const imageUrl = product.image_url || '/logo_oscuro.jpeg';

  return {
    title,
    description,
    openGraph: {
      title: `${product.name} | Amber Joyeria`,
      description,
      url: `/producto/${id}`,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 600,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Amber Joyeria`,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `/producto/${id}`,
    },
  };
}

export default async function ProductoLayout({ params, children }: Props) {
  const { id } = await params;
  const product = await getProduct(parseInt(id));

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.images?.length
          ? product.images
          : [product.image_url],
        description: `${product.name} - Joya en Plata 925 con acabado premium. Amuletos y accesorios con significado.`,
        sku: product.internal_sku,
        brand: {
          '@type': 'Brand',
          name: 'Amber',
        },
        offers: {
          '@type': 'Offer',
          url: `https://amberjoyeria.cl/producto/${id}`,
          priceCurrency: 'CLP',
          price: product.price,
          availability: product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Amber Joyeria',
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.5',
          reviewCount: '12',
        },
        category: product.category?.name || 'Joyeria',
        material: 'Plata 925',
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
