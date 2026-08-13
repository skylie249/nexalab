# NexaLab.app - 프로젝트 컨텍스트

## 프로젝트 개요

- **사이트**: https://www.nexalab.app/
- **스택**: Next.js (App Router 추정) + Supabase
- **컨셉**: 시니어 개발자의 AI 애플리케이션 빌드 로그 및 기술 실험실
- **타겟 독자**: 25~35세 직장인 및 1인 사업가
- **기존 구조**:
  - 블로그 카테고리: AI Apps / Biz
  - Live Sub-Apps: Harubite(하루바이트), Venus Gecko(파충류 샵/모니터링), HappyICT-ON(워크플로우 플랫폼)
  - 다크모드 지원됨

## 진행 상황 로그

### ✅ 완료
- [x] 메인 페이지 "Loading posts..." 노출 버그 수정 (SSR/ISR 전환 완료)
- [x] 모바일 반응형 로직 추가 (기존 사이트 레이아웃 대상, 커밋 `cd297d8`)

### 🔜 예정 (블로그 개선, 우선순위 낮음 — 아래 신규 기능 이후 진행)
- [ ] 코드 블록 복사 버튼
- [ ] 읽는 시간 표시
- [ ] 목차(TOC) + 스크롤 하이라이트
- [ ] 카테고리 필터 UI (`ALL` 탭 실제 필터화)
- [ ] Live Sub-Apps ↔ 관련 포스트 연결

### 🔜 예정 (2순위 유틸 기능 — 견적서 생성기 다음 단계)
- [ ] 프로젝트 손익 계산기 (아래 상세 기획 참고)

---

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

### 서비스 흐름 (요청서 작성 도우미 포함)

기존에는 "서비스 요청서가 이미 있다"는 전제였으나, 실제로는 요청서가 없거나 부실한 사용자가 더 많을 수 있음. 입력 단계에 분기를 추가해 진입장벽을 낮춘다.

```
1. 랜딩: "서비스 요청서가 있으신가요?"
   ├─ 있음 → 파일 업로드 (PDF/DOCX) 또는 텍스트 붙여넣기 (기존 흐름)
   └─ 없음 / 대충만 알고 있음 → 요청서 작성 도우미(위저드) 진입
        - 질문형 위저드: "어떤 서비스가 필요하세요?" 등 단계별 질문에 답하면
          AI가 요청서 텍스트를 자동 구성
        - 자유 텍스트 입력도 허용: 비정형 텍스트("대충 홈페이지 만들고
          결제도 되고...") → AI가 정식 요청서 형태로 재구성
        - 위저드 질문 예시 (웹 개발 업종 기준):
          1) 어떤 종류의 서비스가 필요하세요? (신규 제작/리뉴얼/기능 추가)
          2) 대략 어떤 페이지/기능이 필요하세요? (자유 텍스트, "잘 모르겠어요" 옵션 포함)
          3) 예산 감이 있으신가요? (있음/없음, 있으면 범위 입력)
          4) 언제까지 필요하세요?
        - 답변을 조합해 AI가 요청서 텍스트를 생성 → 2번 단계로 합류

2. (공통) 업종 선택 + (선택) 희망 시간당 단가 입력
3. 문서에서 텍스트 추출 (PDF/DOCX 파싱) — 위저드 경로는 생략(이미 텍스트 상태)
4. Gemini API로 분석:
   - 요청 항목 자동 분류 (기획/디자인/개발/유지보수 등)
   - 항목별 예상 공수(일) 추정
   - 시장 평균 단가 기준 견적 범위 산출
   - 리스크 요소 식별 (예: "결제 연동은 PG사 심사 기간 별도 고려 필요")
5. 결과 화면 표시: 항목별 테이블(작업 항목 | 예상 공수 | 소계) + 총 견적 범위 + 근거
6. PDF 다운로드 버튼 제공
7. (선택, 추후) 이메일 입력 시 리포트 발송 → 리드 수집
```

**위저드 도입 이유 (마케팅 관점)**
- 진입장벽 완화: "요청서 업로드하세요"보다 "몇 가지만 답해주세요"가 시작하기 쉬움
- 퍼널 전환율 개선: 파일 업로드는 이탈률이 높은 단계, 질문 응답형은 이탈이 적음
- 데이터 품질 개선: 사용자가 대충 쓴 문서보다 구조화된 질문으로 뽑아낸 정보가 더 정확할 수 있음
- 확장 여지: "요청서 작성 도우미"만 별도로 떼어 독립 무료 도구로도 홍보 가능

### 데이터 저장 방침: DB 저장 지양 (Stateless 우선)

**원칙: 사용자가 업로드/입력한 요청서 내용, AI 분석 결과는 DB에 저장하지 않는다.**

- 이유:
  - 서비스 요청서에는 고객사 정보, 프로젝트 기밀 내용이 포함될 수 있어 저장 자체가 리스크
  - MVP 단계에서 개인정보 보관/파기 정책을 별도로 설계·운영할 부담을 줄임
  - "업로드 즉시 분석 → 결과만 사용자 화면에 표시 → 서버에는 흔적을 남기지 않음" 구조가 신뢰도 측면에서도 유리 ("데이터를 저장하지 않습니다"를 마케팅 포인트로 활용 가능)
- 처리 방식:
  - 업로드된 파일/텍스트는 요청 처리 중에만 메모리 상에서 사용, 응답 후 즉시 폐기
  - Supabase Storage에 파일을 영속 저장하지 않음 (필요 시 처리용 임시 버퍼만 사용, 디스크/버킷에 쓰지 않는 것을 기본값으로)
  - 결과(견적 데이터)는 API 응답으로만 클라이언트에 전달, 클라이언트 측 상태(React state)로만 유지
  - PDF 다운로드도 서버에 파일을 저장하지 않고, 요청 시점에 즉석 생성 후 스트리밍으로 응답
- 예외적으로 저장이 필요한 경우 (추후 검토):
  - 순수 통계 목적의 익명 집계만 저장 (예: "오늘 몇 건 분석했는지" 카운터) — 원문 내용은 제외
  - 이메일 리드 수집 기능(로드맵 6단계)을 실제로 도입할 경우, 이메일 주소만 별도 최소 컬럼으로 저장하고 요청서 원문과는 연결하지 않음
  - 위 예외도 구현 전 개인정보처리방침 문구 반영 필요

### 업종별 프리셋 (DB 대신 코드/설정 파일로 관리 권장)

원문 데이터를 저장하지 않는 방침과 별개로, 업종별 평균 단가 기준값은 사용자 데이터가 아니므로 DB에 둬도 무방하나, MVP 단계에서는 굳이 테이블을 만들지 않고 코드베이스 내 설정 파일로 관리해 구조를 단순화한다.

```ts
// lib/industry-presets.ts
export const industryPresets = {
  web_dev: {
    label: '웹 개발',
    tasks: {
      기획: { avgDailyRate: 160000, typicalDays: [3, 7] },
      프론트엔드: { avgDailyRate: 160000, typicalDays: [5, 12] },
      결제연동: { avgDailyRate: 200000, typicalDays: [2, 5] },
      관리자페이지: { avgDailyRate: 180000, typicalDays: [3, 8] },
    },
  },
  design: {
    label: '디자인',
    tasks: {
      /* ... */
    },
  },
  // marketing, video 등 추후 추가
} as const
```

향후 프리셋 데이터가 많아지고 운영진이 직접 값을 조정해야 할 필요가 생기면, 그때 Supabase 테이블로 전환을 검토한다 (지금은 코드 배포로 충분).

### 핵심 API 로직 (참고 코드 — 실제 구현 시 조정 필요)

> **AI 분석 엔진: Gemini API 사용** (Anthropic API 아님)
> **DB 저장 없음**: 업로드/입력 데이터와 분석 결과는 요청-응답 사이클 내에서만 사용되고 저장하지 않음. Supabase는 이 기능에서는 사용하지 않는다 (다른 블로그 기능용으로만 유지).

```ts
// app/api/quote/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const industry = formData.get('industry') as string
  const hourlyRate = formData.get('hourlyRate') as string
  const pastedText = formData.get('text') as string | null

  // 1. 텍스트 확보 (업로드 파일 파싱 또는 붙여넣은/위저드 생성 텍스트)
  //    파일은 메모리에서만 처리하고 디스크/Storage에 쓰지 않음
  const extractedText = file
    ? await extractTextFromFile(file) // 파싱 후 file 객체는 즉시 폐기
    : (pastedText ?? '')

  // 2. Gemini API로 견적 분석 요청
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })

  const prompt = `다음은 ${industry} 업종의 서비스 요청서입니다.
아래 형식의 JSON으로만 응답해주세요:

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

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  let quoteData
  try {
    quoteData = JSON.parse(responseText)
  } catch (e) {
    console.error('Gemini JSON 파싱 실패:', responseText)
    return Response.json({ error: '분석 결과 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // 3. 결과를 응답으로만 반환 — 서버 측에 저장하지 않음
  //    (extractedText, quoteData 모두 이 함수 종료와 함께 메모리에서 사라짐)
  return Response.json({ quote: quoteData })
}
```

```ts
// app/api/wizard-to-request/route.ts
// 요청서 작성 도우미(위저드) 답변 → 정식 요청서 텍스트로 변환 (마찬가지로 저장 없음)
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  const { industry, answers } = await req.json()
  // answers 예: { serviceType, features, budget, deadline }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `다음은 사용자가 위저드 질문에 답한 내용입니다.
이를 바탕으로 ${industry} 업종의 정식 서비스 요청서를 자연스러운 문장으로 작성해주세요.
설명 없이 요청서 본문만 출력하세요.

- 서비스 종류: ${answers.serviceType}
- 필요한 페이지/기능: ${answers.features}
- 예산: ${answers.budget || '미정'}
- 희망 완료 시점: ${answers.deadline || '미정'}`

  const result = await model.generateContent(prompt)
  const generatedRequestText = result.response.text()

  // 저장 없이 바로 클라이언트로 반환, 클라이언트가 다음 단계(견적 분석 API)로 그대로 전달
  return Response.json({ requestText: generatedRequestText })
}
```

> ⚠️ 주의: Gemini는 `generationConfig.responseMimeType: 'application/json'` 옵션으로 JSON 강제 출력이 가능하지만, 모델 버전에 따라 지원 여부가 다를 수 있으므로 try-catch 안전장치는 반드시 유지할 것.
> ⚠️ 환경변수: `GEMINI_API_KEY`를 `.env.local`에 추가 필요.
> ⚠️ PDF 다운로드(로드맵 4단계) 구현 시에도 서버에 파일을 저장하지 말고, 요청 시점에 즉석 생성 후 스트리밍 응답으로 처리할 것.

### 운영 리스크 및 대응 방안

| 리스크 | 대응 방안 |
|---|---|
| "AI가 제시한 금액대로 계약했는데 손해봤다" 클레임 | 결과 화면에 "참고용 추정치이며, 실제 계약은 전문가 검토 필요" 명시 |
| 악의적 대량 요청 (비용 폭탄) | Vercel 미들웨어 또는 API Route 내 IP 기준 rate limiting (세션/DB 없이 in-memory 또는 엣지 캐시 활용) |
| 개인정보/기밀 문서 업로드 | **DB 미저장 원칙으로 근본적으로 해소** — 파일은 요청 처리 중 메모리에서만 사용, 응답 즉시 폐기 |
| AI 견적이 비현실적으로 나옴 | 코드 내 `industryPresets` 설정값으로 상한/하한 캡 씌우기 |
| 새로고침 시 결과 유실 | 저장을 안 하는 대신, 클라이언트에서 결과를 sessionStorage 등에 임시 보관해 새로고침 방어 (서버 저장과는 무관) |

### 개발 로드맵 (단계별 진행)

- [x] **1단계 (MVP)**: 텍스트 붙여넣기 → Gemini API 분석 → 결과 화면 (저장 없이 응답만 반환)
- [x] **2단계**: 파일 업로드 추가 (PDF: `pdf-parse`, DOCX: `mammoth`) — 파싱 후 메모리 즉시 폐기
- [x] **3단계**: 요청서 작성 도우미(위저드) 추가 — 질문형 UI + Gemini API로 요청서 텍스트 자동 생성 (저장 없음)
- [x] **4단계**: 결과를 PDF 견적서로 export (`@react-pdf/renderer`) — 서버 저장 없이 즉석 생성/스트리밍
- [x] **5단계**: Rate limiting 적용 (DB 없이 Vercel Edge/미들웨어 기반 IP 제한 방식으로 구현)
- [x] **6단계**: `industryPresets` 설정 파일 데이터 채우기 (업종별 시장 평균 단가 조사 필요, 코드 기반 관리 유지)

#### 구현 메모 (1~2단계)

- `src/app/tools/quote-generator/QuoteGeneratorClient.tsx`: "텍스트 붙여넣기" / "파일 업로드 (PDF·DOCX)" 탭으로 입력 방식 전환. 파일은 8MB 제한, 선택 후 파일명 표시 + 제거 버튼 제공
- `src/lib/extractText.ts`: 업로드된 `File`을 메모리에서 `Buffer`로 변환해 PDF는 `pdf-parse`(`PDFParse.getText()`), DOCX는 `mammoth`(`extractRawText()`)로 텍스트만 추출 — 디스크/Storage에 쓰지 않음
- `src/app/api/quote/route.ts`: 요청 본문을 JSON에서 `multipart/form-data`(`req.formData()`)로 변경. `file` 필드가 있으면 추출 텍스트를, 없으면 `text` 필드를 그대로 사용해 기존 Gemini 분석 로직으로 합류
- `next.config.mjs`: `pdf-parse`(`pdfjs-dist`)를 Next.js 서버 웹팩 번들링 대상에서 제외(`serverExternalPackages`) — 번들링 시 `pdfjs-dist`가 `Object.defineProperty called on non-object` 오류로 깨지는 문제가 있어 필수로 추가함
- `.docx`만 지원 (`mammoth`는 구형 `.doc` 미지원)

#### 구현 메모 (3단계 — 위저드)

- `src/app/tools/quote-generator/QuoteGeneratorClient.tsx`: 컴포넌트를 `step`("landing" / "wizard" / "form") 상태로 분기하도록 재구성
  - **landing**: "서비스 요청서(RFP)가 있으신가요?" 선택 카드 2개 — 있음 → 기존 `form` 단계(1~2단계 UI)로, 없음 → `wizard` 단계로 진입
  - **wizard**: 4단계 질문(서비스 종류 / 페이지·기능(자유 텍스트 + "잘 모르겠어요" 체크박스) / 예산 유무(있으면 범위 입력) / 희망 완료 시점)을 한 번에 하나씩 표시. 마지막 질문에서 "AI로 요청서 만들기" 클릭 시 `/api/wizard-to-request` 호출
  - 위저드 완료 시 생성된 텍스트를 기존 `text` 상태에 채우고 `form` 단계로 합류(문서 흐름의 "2번 단계로 합류"에 해당) — `form`에서는 "AI가 답변을 바탕으로 작성한 초안입니다" 안내와 함께 자유롭게 수정 가능
  - 업종 선택은 문서 흐름대로 위저드 질문에는 포함하지 않고, 위저드 완료 후 합류하는 `form` 단계에서 선택 (위저드 생성 프롬프트는 업종 비의존적)
- `src/app/api/wizard-to-request/route.ts` (신규): `{serviceType, features, budget, deadline}` → Gemini API(`/api/quote`와 동일 모델·REST 방식) 호출 → 자연스러운 문장의 요청서 텍스트만 반환. 입력/출력 모두 저장하지 않음
- **로컬 미검증**: `GEMINI_API_KEY`가 로컬 환경에 없어 위저드→요청서 생성→견적 분석까지 이어지는 전체 흐름은 로컬에서 실행하지 않았음(사용자 요청). 타입체크(`tsc --noEmit`)와 `next build`만 통과 확인. Vercel 배포 환경에서 실제 동작 확인 필요

#### 구현 메모 (4단계 — PDF export)

- `src/lib/quoteSchema.ts` (신규): `route.ts`에 인라인으로 있던 `QuoteSchema`(zod)를 분리 — PDF 라우트(`app/api/quote/pdf/route.tsx`)와 견적 분석 라우트가 동일 스키마를 공유하기 위함
- `src/lib/QuotePdfDocument.tsx` (신규): `@react-pdf/renderer` 기반 PDF 문서 컴포넌트. 한글 출력을 위해 `src/assets/fonts/`의 나눔고딕(Regular/Bold, OFL 라이선스)을 `Font.register`로 등록
- `src/app/api/quote/pdf/route.tsx` (신규): `{ industry, quote }`를 받아 `renderToBuffer`로 즉석 렌더링 후 `Content-Disposition: attachment`로 스트리밍 응답. 서버에 파일을 저장하지 않음(방침 준수)
- `next.config.mjs`: `outputFileTracingIncludes`로 `/api/quote/pdf` 라우트에 폰트 파일(`src/assets/fonts/**`)을 Vercel 서버리스 번들에 포함 — 폰트 파일은 일반 import 대상이 아니라 트레이싱이 자동으로 못 잡아서 명시 필요
- `QuoteGeneratorClient.tsx`: 결과 화면에 "📄 PDF 다운로드" 버튼 추가 (`handleDownloadPdf`) — blob 응답을 받아 `URL.createObjectURL` + 임시 `<a download>`로 클라이언트 사이드 저장 트리거

#### 구현 메모 (5단계 — Rate limiting)

- `src/middleware.ts` (신규): `/api/quote`, `/api/wizard-to-request` 두 엔드포인트만 대상으로 IP 기준 in-memory 카운터 적용 (각각 24시간당 5회/8회). DB/세션 없이 서버리스 인스턴스 메모리에만 유지하는 best-effort 방식 — 완벽한 차단이 아니라 단발성 남용 방지 목적임을 코드 주석에 명시
- `getClientIp`는 `x-forwarded-for` → `x-real-ip` 순으로 조회 (Vercel 환경 기준)
- 제한 초과 시 `429` + `Retry-After` 헤더 응답

#### 구현 메모 (6단계 — industryPresets 데이터)

- `src/lib/quotePresets.ts`: 업종별 `minDailyRate`/`maxDailyRate` 필드 추가. web_dev/design은 공인 노임단가 자료(한국SW산업협회, 디자인대가기준종합정보시스템) 기준, marketing/video는 공인 자료가 없어 외주 플랫폼 단가대를 일 단위로 환산한 근사치 — 출처와 신뢰도 차이를 코드 주석에 명시해둠
- `src/app/api/quote/route.ts`의 `normalizeQuote`: AI가 산출한 총액이 `totalDays × minDailyRate × 0.7 ~ totalDays × maxDailyRate × 1.5` 범위를 벗어나면 자동으로 캡을 씌우고, 보정이 발생하면 `risks` 배열에 안내 문구를 추가 (운영 리스크 표의 "AI 견적이 비현실적으로 나옴" 대응)
- ⚠️ **빌드 이슈 (해결됨)**: `normalizeQuote` 내 `let finalMin`이 재할당되지 않아 ESLint `prefer-const` 규칙 위반으로 `next build`가 실패했었음 → `const`로 수정. `next build` 재실행 후 통과 확인 (2026-08-14)

### 마케팅/배포 계획 (참고)
- Product Hunt 등록 (무료 AI 도구, "견적서" 관련 키워드는 반응 좋은 편)
- 커뮤니티 배포: 디스콰이엇, 요즘IT, OKKY 등 개발자/사업가 커뮤니티
- 결과 화면에 공유 유도 문구 삽입 (예: "이 견적서는 [nexalab.app]에서 AI로 생성되었습니다")
- 블로그 콘텐츠 연동: "AI 견적서 생성기를 만든 과정" 시리즈 글 → 도구 출시와 동시에 발행
- **"업로드하신 자료는 저장하지 않습니다" 문구를 신뢰 포인트로 명시** — 기밀 문서를 다루는 도구 특성상 랜딩/결과 화면에 눈에 띄게 배치 권장

## 🎯 2순위 작업: 프로젝트 손익 계산기 (신규 유틸 기능)

### 목적
견적서 생성기와 같은 "사업관리 담당자용 무료 계산기" 라인업의 두 번째 도구. **저장/로그인 없이, 1회 입력 → 즉시 계산 → 끝**나는 구조를 유지해 기존 무저장 원칙과 완전히 일치시킨다.

> 참고: "미수금 트래커", "월간 매출 대시보드" 등 누적/추적형 사업관리 기능도 논의했으나, 이는 로그인 기반 SaaS 성격으로 현재 전략(무료 트래픽 확보용 1회성 도구)과 맞지 않아 **채택하지 않음**. 필요 시 별도 프로젝트로 검토.

### 기능 정의
사용자가 프로젝트의 **수입(견적/계약 금액)**과 **투입 비용(인건비, 외주비, 재료비, 기타)**을 입력하면, 즉시 **순이익, 마진율, 실질 시급**을 계산해주는 무저장 계산기.

- 타겟: 1인 사업가, 프리랜서 (기존과 동일)
- 목적: 무료 트래픽/인지도 확보
- 견적서 생성기와의 연결: 견적서 생성기에서 나온 "예상 견적 범위"를 손익 계산기의 "수입" 입력값으로 그대로 가져와 쓸 수 있도록 UX 연결 고려 (예: 견적서 결과 화면에 "이 견적으로 손익 계산해보기" 버튼)

### 입력 항목 설계

| 구분 | 항목 | 비고 |
|---|---|---|
| 수입 | 계약/견적 금액 | 필수 |
| 비용 | 내 인건비 (시간×단가 또는 직접 입력) | 본인 인건비를 비용으로 잡을지 선택 가능하게 |
| 비용 | 외주/협업자 비용 | 여러 명일 경우 항목 추가 가능 (동적 행 추가 UI) |
| 비용 | 재료비/툴/구독료 등 기타 경비 | 항목 추가형 |
| 비용 | 플랫폼 수수료 (있다면) | 프리랜서 플랫폼 통한 경우 |
| 부가 | 실제 투입 시간 (선택) | 실질 시급 계산용, 미입력 시 해당 카드는 숨김 처리 |

### 계산 로직

```
순이익 = 수입 − (인건비 + 외주비 + 기타경비 + 수수료 등 모든 비용 항목 합)
마진율(%) = 순이익 ÷ 수입 × 100
실질 시급 = 순이익 ÷ 실제 투입 시간   (투입 시간 입력했을 때만 계산)
```

### 결과 화면 구성
- 순이익 / 마진율 / 실질 시급 3개 지표를 카드로 강조 표시
- 비용 항목별 비중을 보여주는 간단한 시각화 (도넛 차트 등, 선택)
- 업종 평균 마진율과 비교하는 코멘트 (예: "웹개발 업종 평균(30~40%) 범위 안에 있어요") — `industryPresets` 설정 파일의 값을 참고 기준으로 활용, 견적서 생성기와 기준 데이터 공유 가능

### 기술 구현 방향
- **완전 클라이언트 사이드 계산**: 이 기능은 AI API 호출도 필요 없음 — 단순 사칙연산이므로 서버 왕복 없이 React state만으로 즉시 계산 가능
- 서버/DB/API 라우트 불필요 → 개발 난이도 가장 낮은 유틸 기능
- 업종별 평균 마진율 비교 코멘트를 넣을 경우, 견적서 생성기에서 쓰는 `lib/industry-presets.ts` 설정 파일을 그대로 재사용
- 라우트 예: `/tools/profit-calculator`

### 개발 로드맵
- [ ] 1단계: 기본 입력 폼 + 실시간 계산 (수입, 비용 항목 동적 추가, 결과 카드) — **비용 항목 입력행은 모바일 1열 스택, 결과 카드는 모바일 1~2열 wrap으로 처음부터 구현**
- [ ] 2단계: 실질 시급 계산 (투입 시간 입력 시)
- [ ] 3단계: 업종별 평균 마진율 비교 코멘트 (`industryPresets` 연동)
- [ ] 4단계: 견적서 생성기 결과 화면과 연결 ("이 견적으로 손익 계산해보기" 버튼)
- [ ] 5단계: 비용 항목 비중 시각화 (도넛 차트) — 모바일에서 차트 크기/범례 배치 확인

---

## 📱 모바일 반응형 공통 가이드 (신규 기능 개발 시 필수 준수)

기존 사이트 레이아웃에는 모바일 반응형이 적용됐으나(완료 항목 참고), **견적서 생성기·손익 계산기 등 신규 유틸 기능은 아직 미구현 상태이므로, 개발 시점부터 아래 기준을 기본으로 적용**한다. 나중에 반응형을 별도로 추가하는 것이 아니라 처음부터 반영해서 만들 것.

### 공통 원칙
- 브레이크포인트는 기존 사이트에서 쓰는 기준을 그대로 따름 (Tailwind 사용 시 `sm`/`md` 기준)
- 데스크톱 전용으로 먼저 만들고 나중에 축소하는 방식이 아니라, **모바일 레이아웃을 기본값으로 두고 데스크톱에서 확장**하는 방식(mobile-first) 권장

### 항목별 적용 기준

| 화면 요소 | 데스크톱 | 모바일 | 해당 기능 |
|---|---|---|---|
| 결과 테이블 (작업 항목\|공수\|소계 등 컬럼형 데이터) | 테이블 그대로 표시 | **카드형으로 전환** (행 하나 = 카드 하나, 라벨+값 세로 배치). 가로 스크롤 테이블은 지양 | 견적서 생성기 결과 화면 |
| 동적 입력 폼 (항목명 + 금액 등 다중 컬럼 입력행) | 그리드(2열 이상) | **1열 세로 스택**으로 전환 | 손익 계산기 비용 항목, 견적서 생성기 위저드 |
| 요약/지표 카드 그룹 (3~4개 카드 가로 배치) | 3~4열 그리드 | 화면 폭에 따라 1~2열로 wrap (`auto-fit`/`minmax` 또는 명시적 breakpoint 전환) | 손익 계산기 결과(순이익/마진율/실질시급), 견적서 총액 요약 |
| 위저드/단계형 질문 | 여러 질문 한 화면에 표시 가능 | **1문항씩 단계 전환** 방식으로, 진행률 표시(예: 2/4) 함께 제공 | 요청서 작성 도우미 |
| 업종 선택 등 옵션 선택 UI | 드롭다운 또는 버튼 그룹 | **버튼/칩 그룹** 우선 (터치 영역 확보) | 견적서 생성기, 손익 계산기 |
| 파일 업로드 버튼 | 일반 버튼 | 터치 영역 44px 이상 확보, 모바일 파일 선택 시트 고려 | 견적서 생성기 |
| PDF 다운로드/공유 버튼 | "다운로드" 문구 | 모바일에서는 "저장" 또는 "공유"로 문구 조정 검토 (브라우저별 다운로드 동작 차이 고려) | 견적서 생성기 |
| 향후 추가될 TOC(목차) | 사이드바 고정 | **아코디언 또는 상단 드롭다운**으로 전환 (블로그 개선 항목 진행 시 함께 반영) | 블로그 개선 — 목차(TOC) 항목 |

### 주의사항
- 숫자 입력 필드(`type="number"`)는 모바일에서 숫자 키패드가 뜨는지 확인, 금액 콤마 포맷팅이 입력 중 커서 위치를 깨뜨리지 않는지 테스트
- 코드 블록(블로그 개선 항목)은 가로로 긴 코드가 모바일에서 스크롤될 때 복사 버튼이 함께 스크롤되어 안 보이는 문제 없는지 확인 (버튼을 `sticky` 또는 코드 블록 우상단 고정 처리 권장)


---

## 기술 스택 참고

| 구성 요소 | 사용 기술 | 상태 |
|---|---|---|
| 파일 업로드 처리 | 요청 처리 중 메모리에서만 파싱 (Supabase Storage 등 영속 저장소 미사용) | ✅ 구현됨 |
| PDF 텍스트 추출 | `pdf-parse` (v2, `PDFParse.getText()`) | ✅ 구현됨 |
| DOCX 텍스트 추출 | `mammoth` (`extractRawText()`, `.docx`만 지원) | ✅ 구현됨 |
| AI 분석 (견적 분석) | **Gemini API** REST 직접 호출 (`fetch`), 모델: `gemini-3.1-flash-lite` (SDK 미사용) | ✅ 구현됨 |
| AI 위저드 요청서 생성 | Gemini API (위 견적 분석과 동일 방식) | ✅ 구현됨 (로컬 미검증) |
| 결과 저장 | **저장 없음** — API 응답으로만 반환, 클라이언트 상태(React state)로만 유지 | ✅ 구현됨 |
| PDF 생성 (견적서 export) | `@react-pdf/renderer`, 서버 저장 없이 즉석 생성/스트리밍 | ⏳ 4단계 예정 |
| Rate limiting | DB 없이 Vercel Edge Middleware 또는 in-memory 방식 | ⏳ 5단계 예정 |
| 환경변수 | `GEMINI_API_KEY` (.env.local 필요) | — |

> 참고: 기존 사이트에서 Supabase는 블로그 포스트 관리용으로는 계속 사용하되, 이 견적서 생성기 기능에서는 사용하지 않음.

## 작업 시 참고 사항

- 기존 사이트에 이미 다크모드, 카테고리 구조(AI Apps/Biz)가 있으므로 신규 기능도 이 톤앤매너에 맞출 것
- Supabase 클라이언트는 서버/클라이언트 분리해서 사용 (`@supabase/ssr` 패키지 활용) — 단, 견적서 생성기 기능 자체에는 Supabase 미사용
- 새 기능은 별도 라우트로 구성 권장 (예: `/tools/quote-generator`)
- **AI 분석 엔진은 Gemini API로 통일**할 것 (Anthropic API 사용하지 않음) — 견적 분석, 위저드 요청서 생성 모두 동일하게 적용
- 위저드 경로와 업로드/붙여넣기 경로는 최종적으로 동일한 "견적 분석 API"로 합류하는 구조 유지 (분기는 입력 단계에서만)
- **DB 저장 지양 원칙 준수**: 사용자가 업로드/입력한 요청서 내용과 AI 분석 결과는 어떤 형태로도 서버에 영속 저장하지 않음. 새 기능을 추가할 때도 이 원칙을 기본값으로 유지하고, 저장이 필요해 보이는 요구사항이 생기면 먼저 "정말 저장해야 하는가"를 검토할 것
