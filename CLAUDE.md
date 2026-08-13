# CLAUDE.md
# NexaLab.app - 프로젝트 컨텍스트

이 파일은 Claude Code와 함께 진행한 작업 내역을 기록합니다.

## 프로젝트 개요

- **사이트**: https://www.nexalab.app/
- **스택**: Next.js (App Router 추정) + Supabase
- **컨셉**: 시니어 개발자의 AI 애플리케이션 빌드 로그 및 기술 실험실
- **타겟 독자**: 25~35세 직장인 및 1인 사업가
- **기존 구조**:
  - 블로그 카테고리: AI Apps / Biz
  - Live Sub-Apps: Harubite(하루바이트), Venus Gecko(파충류 샵/모니터링), HappyICT-ON(워크플로우 플랫폼)
  - 다크모드 지원됨

## 🎯 현재 최우선 작업: AI 견적서 생성기 (신규 유틸 기능)

### 목적
블로그 콘텐츠만으로는 트래픽 확보가 느리므로, **바로 쓸 수 있는 무료 실용 도구**를 만들어 트래픽/인지도를 모은다. 도구 자체가 "AI 애플리케이션 빌드 로그" 컨셉과 자연스럽게 연결되어, 블로그 콘텐츠(개발 과정)와 도구가 서로 트래픽을 주고받는 구조를 만든다.

### 기능 정의
사용자가 **서비스 요청서/RFP 문서**(PDF, DOCX, 또는 텍스트 붙여넣기)를 업로드하면, AI가 내용을 분석해 **견적서 초안**을 생성해주는 무료 유틸리티.

- 타겟: 1인 사업가, 프리랜서 (25~35세)
- 목적: 무료로 트래픽/인지도 확보 (유료 전환은 아직 고려 안 함)
- 차별화 포인트: 이력서 분석기 등 레드오션 대비 경쟁이 적은 틈새 영역

### 핵심 설계 원칙 (중요 — 반드시 지킬 것)
1. **"정확한 금액"이 아니라 "합리적 범위 + 근거"를 제시할 것**
   - 확정 금액 대신 범위(예: 350만원 ~ 480만원)로 제시
   - 각 항목별 산출 근거를 반드시 함께 표시
   - 법적 리스크 방지 및 신뢰도 확보 목적
2. **업종별 프리셋 필수**
   - 웹/앱 개발, 디자인, 마케팅, 영상 제작 등 업종 먼저 선택
   - 업종에 따라 AI 분석 프롬프트 및 단가 기준 다르게 적용
3. **사용자가 단가를 직접 조정 가능하게**
   - "시간당 O만원으로 계산" 같은 개인 단가 입력 옵션 제공
   - AI가 일방적으로 금액을 정하지 않고 "조정 가능한 초안"으로 인식되게 설계
4. **결과 화면에 면책 문구 명시**
   - "참고용 추정치이며, 실제 계약은 전문가 검토 필요" 등

### 서비스 흐름
```
1. 사용자가 서비스 요청서 업로드 (PDF/DOCX) 또는 텍스트 붙여넣기
2. 업종 선택 + (선택) 희망 시간당 단가 입력
3. 문서에서 텍스트 추출 (PDF/DOCX 파싱)
4. Claude API로 분석:
   - 요청 항목 자동 분류 (기획/디자인/개발/유지보수 등)
   - 항목별 예상 공수(일) 추정
   - 시장 평균 단가 기준 견적 범위 산출
   - 리스크 요소 식별 (예: "결제 연동은 PG사 심사 기간 별도 고려 필요")
5. 결과 화면 표시: 항목별 테이블(작업 항목 | 예상 공수 | 소계) + 총 견적 범위 + 근거
6. PDF 다운로드 버튼 제공
7. (선택, 추후) 이메일 입력 시 리포트 발송 → 리드 수집
```

### 데이터베이스 스키마 (Supabase) — ⚠️ 현재 미사용

> 2026-08-13 업데이트로 견적 결과를 저장하지 않는 방식으로 바뀌면서 아래 두 테이블은 코드에서 더 이상 참조하지 않습니다. Supabase에 만들어두셨다면 삭제하셔도 무방합니다. 아래 스키마는 추후 리드 수집(5단계)이나 캡핑(7단계)을 실제로 구현할 때 참고할 설계로만 남겨둡니다.

```sql
-- 견적 요청 기록 테이블
CREATE TABLE quote_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  industry TEXT, -- 'web_dev', 'design', 'marketing', 'video' 등
  hourly_rate INT, -- 사용자가 직접 입력한 시간당 단가 (선택)
  original_filename TEXT,
  extracted_text TEXT, -- 업로드 문서에서 추출한 원문
  ai_response JSONB, -- AI가 생성한 견적 항목/근거 전체 저장
  session_id TEXT, -- 로그인 없이 익명 세션 추적용
  email TEXT -- 선택: 리포트 받기용 이메일 (리드 수집)
);

-- 업종별 프리셋 (단가 기준값, AI 견적 상/하한 캡 용도)
CREATE TABLE industry_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT NOT NULL,
  task_type TEXT NOT NULL, -- '기획', '디자인', '프론트엔드', '결제연동' 등
  avg_daily_rate INT, -- 업계 평균 일당 (원)
  typical_days_min INT,
  typical_days_max INT
);
```

### 핵심 API 로직 (참고 코드 — 실제 구현 시 조정 필요)

```ts
// app/api/quote/route.ts
import { createClient } from '@/utils/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const industry = formData.get('industry') as string
  const hourlyRate = formData.get('hourlyRate') as string

  // 1. 문서에서 텍스트 추출 (PDF/DOCX)
  const extractedText = await extractTextFromFile(file)

  // 2. Claude API로 견적 분석 요청
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `다음은 ${industry} 업종의 서비스 요청서입니다.
      아래 형식의 JSON으로만 응답해주세요 (다른 설명 없이):

      요청서 내용:
      ${extractedText}

      기준 시간당 단가: ${hourlyRate || '업계 평균 사용'}

      응답 형식:
      {
        "items": [{"name": "항목명", "days": 숫자, "amount": 숫자, "reason": "산출 근거"}],
        "total_min": 숫자,
        "total_max": 숫자,
        "risks": ["리스크 요소1", "리스크 요소2"]
      }`
    }]
  })

  const quoteData = JSON.parse(message.content[0].text)

  // 3. Supabase에 기록 저장
  const supabase = createClient()
  const { data, error } = await supabase
    .from('quote_requests')
    .insert({
      industry,
      hourly_rate: hourlyRate ? parseInt(hourlyRate) : null,
      extracted_text: extractedText,
      ai_response: quoteData,
      original_filename: file.name,
    })
    .select()
    .single()

  return Response.json({ quote: quoteData, id: data?.id })
}
```

> ⚠️ 주의: `JSON.parse(message.content[0].text)`는 Claude 응답에 JSON 외 텍스트가 섞이면 에러가 남. 프롬프트에 "JSON만 응답" 지시가 있어도 안전장치로 정규식 추출 또는 try-catch 필수 추가.

### 운영 리스크 및 대응 방안

| 리스크 | 대응 방안 |
|---|---|
| "AI가 제시한 금액대로 계약했는데 손해봤다" 클레임 | 결과 화면에 "참고용 추정치이며, 실제 계약은 전문가 검토 필요" 명시 |
| 악의적 대량 요청 (비용 폭탄) | Supabase Edge Function 또는 미들웨어로 IP당 1일 3~5회 제한 |
| 개인정보/기밀 문서 업로드 | "업로드 파일은 분석 후 24시간 내 자동 삭제" 정책 + Storage TTL 설정 |
| AI 견적이 비현실적으로 나옴 | `industry_presets` 테이블로 상한/하한 캡 씌우기 |

### 개발 로드맵 (단계별 진행)

- [x] **1단계 (MVP)**: 텍스트 붙여넣기 → AI 분석 → 결과 화면 (파일 업로드 없이 텍스트 인풋으로 먼저 검증)
- [ ] **2단계**: 파일 업로드 추가 (PDF: `pdf-parse`, DOCX: `mammoth`)
- [ ] **3단계**: 결과를 PDF 견적서로 export (`@react-pdf/renderer`)
- [ ] **4단계**: 공유 기능 — 결과 페이지 고유 URL 생성 → SNS 공유 유도
- [ ] **5단계**: 이메일 리드 수집 — "리포트 이메일로 받기" 옵션
- [ ] **6단계**: Rate limiting 적용 (IP당 일일 요청 제한)
- [ ] **7단계**: `industry_presets` 데이터 채우기 (업종별 시장 평균 단가 조사 필요)

### 마케팅/배포 계획 (참고)
- Product Hunt 등록 (무료 AI 도구, "견적서" 관련 키워드는 반응 좋은 편)
- 커뮤니티 배포: 디스콰이엇, 요즘IT, OKKY 등 개발자/사업가 커뮤니티
- 결과 화면에 공유 유도 문구 삽입 (예: "이 견적서는 [nexalab.app]에서 AI로 생성되었습니다")
- 블로그 콘텐츠 연동: "AI 견적서 생성기를 만든 과정" 시리즈 글 → 도구 출시와 동시에 발행

---

## 기술 스택 참고

| 구성 요소 | 사용 기술 |
|---|---|
| 파일 업로드 | Supabase Storage |
| PDF 텍스트 추출 | `pdf-parse` 또는 `pdfjs-dist` |
| DOCX 텍스트 추출 | `mammoth` |
| AI 분석 | Anthropic API (Claude) |
| 결과 저장 | (현재 미사용) 저장하지 않고 화면에만 표시. 추후 필요 시 Supabase DB (`quote_requests` 테이블) |
| PDF 생성 (견적서 export) | `@react-pdf/renderer` |
| Rate limiting | Supabase Edge Function 또는 Vercel 미들웨어 |

## 작업 시 참고 사항

- 기존 사이트에 이미 다크모드, 카테고리 구조(AI Apps/Biz)가 있으므로 신규 기능도 이 톤앤매너에 맞출 것
- Supabase 클라이언트는 서버/클라이언트 분리해서 사용 (`@supabase/ssr` 패키지 활용)
- 새 기능은 별도 라우트로 구성 권장 (예: `/tools/quote-generator`)


## 추후 작업 내역

### 2026-08-13
- `src/app/layout.tsx`에 Google AdSense 스크립트(`adsbygoogle.js`) 추가 (`next/script`, `strategy="afterInteractive"`, `client=ca-pub-7463332684235098`)
- `public/ads.txt` 추가 (AdSense ads.txt 인증용, `pub-7463332684235098`)
- AdSense에서 ads.txt 감지 완료, 사이트 승인 신청 진행함
- 예정: 슬롯 ID 확보 후 `AdSenseMock` 컴포넌트 4곳(`src/components/Sidebar.tsx` 2곳, `src/app/posts/[id]/page.tsx` 2곳)을 실제 `<ins className="adsbygoogle">` 코드로 교체
- **AI 견적서 생성기 1단계(MVP) 구현 완료** (`/tools/quote-generator`)
  - `src/lib/quotePresets.ts`: 업종별(웹/앱 개발, 디자인, 마케팅, 영상 제작) 프롬프트 컨텍스트 및 기준 일당 프리셋
  - `src/app/api/quote/route.ts`: 텍스트 입력 → AI 분석 → JSON 파싱(정규식 추출 + zod 검증 안전장치) → Supabase `quote_requests` 기록(실패해도 응답은 계속 진행) → 쿠키 기반 익명 `session_id` 발급
  - `src/app/tools/quote-generator/`: 업종 선택 + 희망 시간당 단가(선택) + RFP 텍스트 붙여넣기 폼, 결과 화면(항목별 테이블 + 총 견적 범위 + 리스크 + 면책 문구)
  - Header 네비게이션에 "AI 견적서" 링크 추가
  - **미구현(다음 단계)**: 파일 업로드(PDF/DOCX), PDF 다운로드, 공유 URL, 이메일 리드 수집, IP 기준 rate limiting, `industry_presets` 테이블 연동(현재는 코드에 하드코딩)
  - **사용자 확인 필요**:
    1. `.env.local`의 `GEMINI_API_KEY`에 실제 키 입력
    2. Supabase에 `quote_requests` 테이블 수동 생성 (CLAUDE.md 상단 스키마 참고) + anon 역할의 INSERT 정책 추가 (없으면 견적 생성은 정상 동작하되 기록만 저장되지 않고 서버 로그에 에러 출력됨)
  - **(업데이트) AI 제공자를 Claude → Gemini로 변경**: Claude Pro 구독은 API 사용료를 커버하지 않아 별도 종량 과금이 필요하다는 점을 확인 후, 비용 부담이 적은 Gemini API(`gemini-3.1-flash-lite`, REST `generateContent` 직접 호출)로 교체함. `@anthropic-ai/sdk` 의존성 제거, `structured output`(`responseMimeType: "application/json"` + `responseSchema`)으로 JSON 형식 강제. 모델 교체가 필요하면 `route.ts`의 `GEMINI_MODEL` 상수만 변경하면 됨
  - **(업데이트) Supabase 저장을 service_role 키로 전환**: `quote_requests` insert가 RLS 정책 미설정 시 실패하던 문제를 해결하기 위해 service_role 키를 도입. 단, `NEXT_PUBLIC_*` 접두사를 붙이면 브라우저 번들에 노출되어 DB 전체가 RLS 없이 뚫리는 심각한 보안 사고로 이어지므로, **`SUPABASE_SERVICE_ROLE_KEY`(공개 접두사 없음) + `src/lib/supabase-admin.ts`(서버 전용, `server-only` 패키지로 클라이언트 번들 포함 시 빌드 에러 발생시킴)**로 분리 구현함. 공개 콘텐츠 조회(`page.tsx`, `posts/[id]/page.tsx`)는 기존 anon 키(`src/lib/supabase.ts`) 그대로 사용
  - **(업데이트) Supabase 저장 기능 제거**: 견적 결과를 DB에 기록하지 않고 화면에 보여주기만 하는 방식으로 변경. `src/app/api/quote/route.ts`에서 Supabase insert, 익명 세션 쿠키 로직을 모두 제거했고 `src/lib/supabase-admin.ts`(더 이상 참조되지 않음)와 `server-only` 패키지도 삭제함. `.env.local`의 `SUPABASE_SERVICE_ROLE_KEY`는 현재 미사용 상태로 값만 남겨둠. 이 문서 상단의 `quote_requests` / `industry_presets` 스키마는 현재 코드와 연동되어 있지 않은 참고용 설계임
  - **(업데이트) `posts`/`categories` 테이블 RLS 정책 추가 가이드 제공**: 두 테이블이 RLS disabled 상태였는데, 이 경우 anon 키만으로 쓰기(INSERT/UPDATE/DELETE)까지 가능할 수 있는 보안 리스크가 있어 `supabase-rls.sql`(신규, 저장소 루트) 파일로 RLS 활성화 + 공개 읽기 전용(`SELECT`) 정책 SQL을 정리해둠. 실행은 Supabase SQL Editor에서 사용자가 직접 해야 함. 글 작성/수정은 계속 대시보드에서 진행(대시보드는 RLS 영향 안 받음)

