import Link from 'next/link';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://amberjoyeria.cl';

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-platinum-600 mb-8">
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-amber-gold-500 transition-colors">
                {item.name}
              </Link>
            ) : (
              <span className="text-obsidian-900">{item.name}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
