import ArticleHeader from "@/components/ArticleHeader";
import TableOfContents from "@/components/TableOfContents";
import AdSenseMock from "@/components/AdSenseMock";
import TagList from "@/components/TagList";
import RelatedPosts from "@/components/RelatedPosts";
import Sidebar from "@/components/Sidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

const TOC_ITEMS = [
  { id: "intro", text: "1. 개요 및 파이프라인 구조", level: 2 },
  { id: "ollama", text: "2. Ollama 로컬 환경 구성", level: 2 },
  { id: "n8n", text: "3. n8n 워크플로우 자동화 연결", level: 2 },
  { id: "harubite", text: "4. harubite.nexalab.app 적용 사례", level: 2 },
];

const RELATED_POSTS = [
  { id: "1", title: "Next.js 15 & Vercel 멀티 도메인 바인딩 가이드", url: "#" },
  { id: "2", title: "AI 시대의 신사업 아이디어: 파충류 케어 자동화 (venus.nexalab.app)", url: "#" },
];

const MOCK_CONTENT = `
## 1. 개요 및 파이프라인 구조
본 포스팅에서는 생성형 AI 기반의 백엔드 오케스트레이션을 활용하여 시스템을 구축합니다.

\`\`\`python
# 예시 코드 블록 (Syntax Highlighting)
def process_ai_task(payload):
    return n8n_trigger(payload)
\`\`\`

## 2. Ollama 로컬 환경 구성
로컬 LLM을 구축할 때 보안과 응답 속도를 최적화하기 위해 다음과 같은 세팅을 권장합니다.
모델 파라미터를 조절하여 적절한 토큰 생성 속도와 컨텍스트 사이즈를 확보해야 합니다.

| 파라미터 | 값 | 설명 |
| -------- | --- | ---- |
| temperature | 0.7 | 창의성 조절 |
| context | 4096 | 컨텍스트 크기 |

> 이것은 인용구 블록입니다. 마크다운 스타일링 테스트.

## 3. n8n 워크플로우 자동화 연결
웹훅(Webhook) 이벤트를 수신하여 자동 포스팅 및 노션 연동을 구축하는 워크플로우를 살펴보겠습니다.

## 4. harubite.nexalab.app 적용 사례
실제 운영 중인 서브 SPA 서비스인 [Harubite 데모](https://harubite.nexalab.app)에 해당 파이프라인을 적용한 결과 트래픽 감소 효과와...
`;

export async function generateStaticParams() {
  try {
    const { data: posts } = await supabase.from('posts').select('slug').eq('published', true);
    return posts?.map((post) => ({ slug: post.slug })) || [];
  } catch (e) {
    return [];
  }
}

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  // Supabase Fetch
  let post = null;
  try {
    const { data } = await supabase
      .from('posts')
      .select('*, categories(name)')
      .eq('slug', resolvedParams.slug)
      .eq('published', true)
      .single();
    post = data;
  } catch (e) {
    console.error("Supabase fetch error, using fallback mock data.");
  }

  // Fallback Mock Data for UI testing without real DB
  if (!post) {
    post = {
      title: "Ollama와 n8n을 활용한 백엔드 자동화 파이프라인 구축기",
      categories: { name: "AI Applications" },
      created_at: "2026-08-12T00:00:00Z",
      content: MOCK_CONTENT,
      tags: ["AI", "Ollama", "n8n", "Automation", "Nexalab"],
      views: 1240
    };
  }
  
  return (
    <div className={styles.gridContainer}>
      <section className={styles.mainArea}>
        <ArticleHeader 
          category={post.categories?.name || 'Uncategorized'}
          title={post.title}
          author="Kim Ho-gyun"
          date={new Date(post.created_at).toLocaleDateString('ko-KR')}
          readTime="8분"
          hits={post.views?.toLocaleString() || "0"}
        />

        <TableOfContents items={TOC_ITEMS} />

        <AdSenseMock id="Ad #1" type="Horizontal / Responsive" width="100%" height="90px" />

        <article className={styles.articleContent}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Add AdSense #3 (In-article) before h3 or specifically after h2 #2
              // For a complex injection, we usually parse AST, but for simplicity here,
              // we can render AdSense #3 just inside the article at a fixed spot if we want.
              // For now, we will render it at the top of the content or manually handled.
              // We'll leave the AdSense #3 rendering outside of the markdown for this mock, 
              // or we can just render the markdown. 
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        <TagList tags={post.tags || []} />

        <div className={styles.multiplexAds}>
          <AdSenseMock id="Ad #4" type="Multiplex / Sponsor" width="100%" height="300px" />
        </div>

        <RelatedPosts posts={RELATED_POSTS} />
      </section>

      <div className={styles.sidebarWrapper}>
        <Sidebar isPostDetail={true} />
      </div>
    </div>
  );
}
