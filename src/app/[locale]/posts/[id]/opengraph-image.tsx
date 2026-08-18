import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export const alt = 'NexaLab 포스팅 대표 이미지';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const resolvedParams = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  );

  let postTitle = 'NexaLab Tech Blog';
  let category = 'AI Applications';
  try {
    const { data } = await supabase
      .from('posts')
      .select('title, categories(name)')
      .eq('id', resolvedParams.id)
      .single();
    if (data) {
      postTitle = data.title;
      const categories = data.categories as { name?: string } | { name?: string }[] | null;
      const categoryData = Array.isArray(categories) ? categories[0] : categories;
      category = categoryData?.name || category;
    }
  } catch {
    // Fall back to defaults above.
  }

  // 한글 폰트 (Pretendard) 로드
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
          backgroundColor: '#0f172a', // Dark theme background
          padding: '60px 80px',
          color: '#f8fafc',
          fontFamily: '"Pretendard"', // 폰트 이름 매칭
        }}
      >
        {/* 상단 브랜딩 영역 */}
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

        {/* 중앙 타이틀 영역 */}
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

        {/* 하단 저자 및 서브 도메인 정보 */}
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
            harubite · venus · on
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
