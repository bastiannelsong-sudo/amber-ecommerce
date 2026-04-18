import { ImageResponse } from 'next/og';
import { getProductTypeCopy, isProductTypeSlug, PRODUCT_TYPE_SLUGS } from '../lib/seo-copy';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'AMBER Joyería';

export function generateImageMetadata() {
  return PRODUCT_TYPE_SLUGS.map((type) => ({ id: type, params: { type } }));
}

interface Props {
  params: Promise<{ type: string }>;
}

export default async function Image({ params }: Props) {
  const { type } = await params;
  const copy = isProductTypeSlug(type) ? getProductTypeCopy(type) : null;
  const title = copy?.h1 ?? 'AMBER Joyas';
  const subtitle = copy?.lead ?? 'Joyería artesanal en plata 925';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'linear-gradient(135deg, #0a0a0b 0%, #1a1410 45%, #2a1a08 100%)',
          color: '#fafafa',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#fbbf24',
            fontWeight: 500,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0a0a0b',
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            A
          </div>
          AMBER Joyería
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              fontSize: 104,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1,
              color: '#fafafa',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              color: '#d4d4d8',
              maxWidth: 980,
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(251, 191, 36, 0.25)',
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 20, color: '#a1a1aa', letterSpacing: 3, textTransform: 'uppercase' }}>
            Plata 925 · Envío a todo Chile
          </span>
          <span style={{ fontSize: 22, color: '#fbbf24', fontWeight: 600 }}>amberjoyeria.cl</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
