import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import ClientProviders from './components/ClientProviders';
import "./globals.css";

// Elegant serif font for headings - luxury aesthetic
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

export const metadata: Metadata = {
  title: "Amber — Joyería de Lujo",
  description: "Descubre nuestra colección exclusiva de joyería artesanal. Elegancia atemporal para momentos especiales.",
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
        <Toaster position="top-right" />
        <ClientProviders />
        {children}
      </body>
    </html>
  );
}
