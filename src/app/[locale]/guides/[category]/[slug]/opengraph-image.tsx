import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { getGuideCategoryLabel } from '@/lib/guides';
import { decodeSlugParam } from '@/lib/postSlug';

export const alt = 'NexaLab 가이드 대표 이미지';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const resolvedParams = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  );

  let postTitle = 'NexaLab 가이드';
  try {
    const { data } = await supabase
      .from('posts')
      .select('title')
      .eq('type', 'guide')
      .eq('category', resolvedParams.category)
      .eq('slug', decodeSlugParam(resolvedParams.slug))
      .single();
    if (data) postTitle = data.title;
  } catch {
    // Fall back to defaults above.
  }

  const category = getGuideCategoryLabel(resolvedParams.category);

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
          <span style={{ fontSize: 24, fontWeight: 'bold', color: '#94a3b8' }}>
            NexaLab.app
          </span>
          <span style={{ fontSize: 20, color: '#475569', marginLeft: '12px', marginRight: '12px' }}>|</span>
          <span
            style={{
              fontSize: 20,
              color: '#60a5fa',
              backgroundColor: '#1e3a8a',
              padding: '4px 12px',
              borderRadius: '6px',
            }}
          >
            {category}
          </span>
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            wordBreak: 'keep-all',
            color: '#ffffff',
            maxWidth: '1000px',
            display: 'flex',
          }}
        >
          {postTitle}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: 20, color: '#cbd5e1' }}>Kim Ho-gyun</span>
            <span style={{ fontSize: 18, color: '#64748b', marginLeft: '8px' }}>
              · Senior Software Engineer
            </span>
          </div>
          <div style={{ fontSize: 18, color: '#64748b', display: 'flex' }}>
            nexalab.app
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
