import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'NexaLab.app';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const title: string = messages.metadata?.title ?? 'NexaLab.app';
  const description: string = messages.metadata?.description ?? '';

  const fontData = await fetch(
    new URL('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/web/static/woff/Pretendard-Bold.woff')
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          padding: '60px 80px',
          color: '#f8fafc',
          fontFamily: '"Pretendard"',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
            }}
          />
          <span style={{ fontSize: 24, fontWeight: 'bold', color: '#94a3b8' }}>NexaLab.app</span>
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            wordBreak: 'keep-all',
            color: '#ffffff',
            maxWidth: '1000px',
            display: 'flex',
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #334155',
            paddingTop: '24px',
          }}
        >
          <div style={{ fontSize: 22, color: '#cbd5e1', maxWidth: '900px', display: 'flex' }}>
            {description}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Pretendard',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
