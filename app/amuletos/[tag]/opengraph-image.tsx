import { ImageResponse } from 'next/og';
import { getSupportedTagSlugs, getTagCopy } from '../../lib/seo-copy';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Amuletos AMBER';

export function generateImageMetadata() {
  return getSupportedTagSlugs().map((tag) => ({ id: tag, params: { tag } }));
}

interface Props {
  params: Promise<{ tag: string }>;
}

export default async function Image({ params }: Props) {
  const { tag } = await params;
  const copy = getTagCopy(tag);
  const title = copy?.h1 ?? 'Amuletos';
  const subtitle = copy?.lead ?? 'Protección con significado';

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
            'linear-gradient(135deg, #0b0816 0%, #1b0f2a 45%, #2d1840 100%)',
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
            color: '#c4b5fd',
            fontWeight: 500,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
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
          Amuletos AMBER
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
            borderTop: '1px solid rgba(167, 139, 250, 0.25)',
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 20, color: '#a1a1aa', letterSpacing: 3, textTransform: 'uppercase' }}>
            Amuletos de protección · Plata 925
          </span>
          <span style={{ fontSize: 22, color: '#c4b5fd', fontWeight: 600 }}>amberjoyeria.cl</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
