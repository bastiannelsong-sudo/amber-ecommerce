import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import ClientProviders from './components/ClientProviders';
import "./globals.css";

// Elegant serif font for headings - refined aesthetic
const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: 'swap',
});

// Clean sans-serif for body text - refined and readable
const montserrat = Montserrat({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://amberjoyeria.cl';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AMBER — Joyas con Alma | Plata 925 y Accesorios',
    template: '%s | AMBER Joyas',
  },
  description: 'Joyeria en Plata 925, amuletos de proteccion y accesorios con significado. Envio gratuito en compras sobre $30.000. Garantia de 12 meses. Compra segura con MercadoPago.',
  keywords: ['joyas plata 925', 'joyeria plata chile', 'amuletos proteccion', 'collar metatron', 'nudo de brujas', 'bisuteria chile', 'aros plata', 'collares plata fina', 'regalos mujer'],
  authors: [{ name: 'AMBER Joyas' }],
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: SITE_URL,
    siteName: 'AMBER Joyas',
    title: 'AMBER — Joyas con Alma | Plata 925 y Accesorios',
    description: 'Joyeria en Plata 925, amuletos de proteccion y accesorios con significado. Envio gratuito sobre $30.000.',
    images: [
      {
        url: '/logo_oscuro.jpeg',
        width: 1200,
        height: 630,
        alt: 'AMBER Joyas - Plata 925 y Amuletos de Proteccion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AMBER — Joyas con Alma | Plata 925 y Accesorios',
    description: 'Joyeria en Plata 925, amuletos de proteccion y accesorios con significado.',
    images: ['/logo_oscuro.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${montserrat.variable}`}>
      <body
        className="antialiased"
        style={{ fontFamily: 'var(--font-montserrat)' }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'AMBER Joyas',
              url: SITE_URL,
              logo: `${SITE_URL}/logo_oscuro.jpeg`,
              description:
                'Joyeria en Plata 925, amuletos de proteccion y accesorios con significado.',
              sameAs: ['https://www.instagram.com/amber.joyas'],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                availableLanguage: 'Spanish',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: `${SITE_URL}/catalogo?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <Toaster position="top-right" />
        <ClientProviders />
        {children}
      </body>
    </html>
  );
}
