# NexaLab.app - 프로젝트 컨텍스트

## 프로젝트 개요

- **사이트**: https://www.nexalab.app/
- **스택**: Next.js (App Router 추정) + Supabase
- **컨셉**: 시니어 개발자의 AI 애플리케이션 빌드 로그 및 기술 실험실
- **타겟 독자**: 25~35세 직장인 및 1인 사업가
- **기존 구조**:
  - 블로그 카테고리: AI Apps / Biz
  - Live Sub-Apps: Harubite(하루바이트, 외국어 습관), Venus Gecko(크레스티드 게코 분양 샵 홍보 사이트 — AI 모니터링 도구 아님, 2026-08-21 정정). Report 점검기(웹사이트 리포트 자동 점검)는 개발 중 — 카드/AI Apps에 "준비중" 배지로 노출
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
6. ~~PDF 다운로드 버튼 제공~~ — **제외됨**: `@react-pdf/renderer`가 Next.js App Router에서 정상 동작하지 않아(아래 로드맵 4단계 참고) 기능 자체를 도입하지 않기로 결정
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
- [x] ~~**4단계**: 결과를 PDF 견적서로 export~~ — **시도 후 기능 제외 결정** (아래 구현 메모 참고, `@react-pdf/renderer` + Next.js App Router 호환성 문제)
- [x] **5단계**: Rate limiting 적용 (DB 없이 Vercel Edge/미들웨어 기반 IP 제한 방식으로 구현)
- [x] **6단계**: `industryPresets` 설정 파일 데이터 채우기 (업종별 시장 평균 단가 조사 필요, 코드 기반 관리 유지)

#### 구현 메모 (1~2단계)

- `src/app/tools/quote-generator/QuoteGeneratorClient.tsx`: "텍스트 붙여넣기" / "파일 업로드 (PDF·DOCX)" 탭으로 입력 방식 전환. 파일은 8MB 제한, 선택 후 파일명 표시 + 제거 버튼 제공
- `src/lib/extractText.ts`: 업로드된 `File`을 메모리에서 `Buffer`로 변환해 PDF는 `pdf-parse`(`PDFParse.getText()`), DOCX는 `mammoth`(`extractRawText()`)로 텍스트만 추출 — 디스크/Storage에 쓰지 않음
- `src/app/api/quote/route.ts`: 요청 본문을 JSON에서 `multipart/form-data`(`req.formData()`)로 변경. `file` 필드가 있으면 추출 텍스트를, 없으면 `text` 필드를 그대로 사용해 기존 Gemini 분석 로직으로 합류
- `next.config.mjs`: `pdf-parse`(`pdfjs-dist`)를 Next.js 서버 웹팩 번들링 대상에서 제외(`serverExternalPackages`) — 번들링 시 `pdfjs-dist`가 `Object.defineProperty called on non-object` 오류로 깨지는 문제가 있어 필수로 추가함
- `.docx`만 지원 (`mammoth`는 구형 `.doc` 미지원)

⚠️ **트러블슈팅 (Vercel 배포 후 발생): PDF 업로드 시 `FUNCTION_INVOCATION_FAILED` / `DOMMatrix is not defined`**
- 원인: `extractText.ts`는 처음부터 `pdfjs-dist`를 직접 쓴 적이 없고 항상 `pdf-parse`(`PDFParse` 클래스)만 사용해왔음. 실제 원인은 `pdf-parse` v2가 Node/서버리스 환경에서 브라우저의 `DOMMatrix` 등 캔버스 API 자리에 `@napi-rs/canvas`(네이티브 napi 모듈)를 쓰는데, 이 패키지가 webpack 번들링 대상에서 빠지지 않아 Vercel 런타임에서 로드에 실패하던 것 — pdf-parse 공식 Vercel/Next.js 가이드([`docs/troubleshooting.md`](https://github.com/mehmet-kozan/pdf-parse/blob/main/docs/troubleshooting.md))에서 확인
- 조치 (완료):
  1. `next.config.mjs`의 `serverExternalPackages`에 `"@napi-rs/canvas"` 추가 (`pdf-parse`, `pdfjs-dist`와 함께 번들링 제외)
  2. `extractText.ts` 최상단에 `import "pdf-parse/worker";`를 `import { PDFParse } from "pdf-parse";`보다 먼저 추가 — 워커를 먼저 등록해야 서버리스 환경에서 정상 동작
- 검증: `tsc --noEmit`/`next build` 통과 + 로컬에서 직접 만든 최소 PDF 파일로 `extractTextFromFile` 동작 확인(텍스트 정상 추출, 에러 없음). **Vercel 실제 배포 환경에서의 최종 확인은 아직 못함 — 배포 후 PDF 업로드로 재현 여부 확인 필요**

#### 구현 메모 (3단계 — 위저드)

- `src/app/tools/quote-generator/QuoteGeneratorClient.tsx`: 컴포넌트를 `step`("landing" / "wizard" / "form") 상태로 분기하도록 재구성
  - **landing**: "서비스 요청서(RFP)가 있으신가요?" 선택 카드 2개 — 있음 → 기존 `form` 단계(1~2단계 UI)로, 없음 → `wizard` 단계로 진입
  - **wizard**: 4단계 질문(서비스 종류 / 페이지·기능(자유 텍스트 + "잘 모르겠어요" 체크박스) / 예산 유무(있으면 범위 입력) / 희망 완료 시점)을 한 번에 하나씩 표시. 마지막 질문에서 "AI로 요청서 만들기" 클릭 시 `/api/wizard-to-request` 호출
  - 위저드 완료 시 생성된 텍스트를 기존 `text` 상태에 채우고 `form` 단계로 합류(문서 흐름의 "2번 단계로 합류"에 해당) — `form`에서는 "AI가 답변을 바탕으로 작성한 초안입니다" 안내와 함께 자유롭게 수정 가능
  - 업종 선택은 문서 흐름대로 위저드 질문에는 포함하지 않고, 위저드 완료 후 합류하는 `form` 단계에서 선택 (위저드 생성 프롬프트는 업종 비의존적)
- `src/app/api/wizard-to-request/route.ts` (신규): `{serviceType, features, budget, deadline}` → Gemini API(`/api/quote`와 동일 모델·REST 방식) 호출 → 자연스러운 문장의 요청서 텍스트만 반환. 입력/출력 모두 저장하지 않음
- **로컬 미검증**: `GEMINI_API_KEY`가 로컬 환경에 없어 위저드→요청서 생성→견적 분석까지 이어지는 전체 흐름은 로컬에서 실행하지 않았음(사용자 요청). 타입체크(`tsc --noEmit`)와 `next build`만 통과 확인. Vercel 배포 환경에서 실제 동작 확인 필요

#### 구현 메모 (4단계 — PDF export, 시도 후 제외됨)

**결론: `@react-pdf/renderer`로 PDF 생성 기능을 구현했었으나, Vercel 배포 후 100% 재현되는 문제를 해결하지 못해 기능 자체를 코드베이스에서 제거함(2026-08-14). PDF 다운로드는 현재 로드맵에 없음.**

- 최초 구현: `src/lib/quoteSchema.ts`(zod 스키마 분리), `src/lib/QuotePdfDocument.tsx`(`@react-pdf/renderer` 문서 컴포넌트, 나눔고딕 폰트), `src/app/api/quote/pdf/route.tsx`(App Router 라우트 핸들러, `renderToBuffer` 사용), `next.config.mjs`의 `outputFileTracingIncludes`(폰트 파일 번들 포함), `QuoteGeneratorClient.tsx`의 "📄 PDF 다운로드" 버튼 — 모두 제거됨
- **증상**: 배포 후 PDF 다운로드 클릭 시 500 에러, 서버 로그에 `Minified React error #31 (Objects are not valid as a React child, found: object with keys {$$typeof, type, key, ref, props})`
- **원인 조사 과정** (`next build && next start`로 로컬 재현 성공 후 진행):
  1. `next.config.mjs`의 `serverExternalPackages`에 `@react-pdf/renderer` 추가(react-pdf 공식 문서가 App Router용으로 권장하는 회피책) — **효과 없음**, 동일 에러 재현
  2. JSX 대신 `React.createElement`로 직접 엘리먼트 트리를 구성해도 App Router 라우트 안에서는 **동일하게 실패** — JSX 트랜스파일 문제가 아니라 Next.js App Router의 웹팩/RSC 번들링 레이어에서 우리 코드가 사용하는 'react' 모듈 인스턴스와 `@react-pdf/renderer`(정확히는 그 내부의 `@react-pdf/reconciler`)가 기대하는 'react' 인스턴스가 서로 다르게 취급되는 것으로 추정(다수의 관련 GitHub 이슈에서도 동일 증상 보고, 확정된 공식 수정 방법 없음)
  3. 우회책으로 Pages Router API 라우트(`pages/api/quote/pdf.tsx`)로 이전 시도 — App Router의 RSC 번들링 레이어를 아예 타지 않으므로 이론상 회피 가능하나, `pages/`와 `app/`가 한 프로젝트에 공존하는 순간 이 프로젝트의 Next.js 버전(15.5.23)에서 `next build`의 내부 타입 생성기(`.next/types/validator.ts`)가 `Cannot find module '../../app/about/page.js'` 같은 무관한 페이지를 못 찾는 별도의 빌드 오류를 일으킴(재현 확인됨, Next.js GitHub에도 유사 미해결 이슈 존재) — 이 경로도 막힘
- **결정**: 두 우회책 모두 로컬에서 안정적으로 검증되지 않아, 계속 디버깅하는 대신 PDF 다운로드 기능 자체를 제외하기로 결정. 관련 패키지(`@react-pdf/renderer`)·폰트 자산(`src/assets/fonts/`)·컴포넌트·라우트·버튼 모두 제거함
- **재시도 시 참고**: 이 문제는 Next.js App Router + `@react-pdf/renderer` 조합의 알려진(미해결) 호환성 이슈로 보임. 재도입을 검토한다면 (a) Next.js/react-pdf의 향후 버전 업데이트로 해결됐는지 먼저 확인, (b) `@react-pdf/renderer` 대신 서버에서 완전히 분리된 방식(별도 마이크로서비스, 브라우저 측 `jsPDF`/`html2canvas` 조합 등)을 고려, (c) Pages Router 이전을 다시 시도할 경우 이번에 겪은 `pages`+`app` 공존 타입생성기 버그가 해당 Next.js 버전에서 아직 남아있는지 먼저 확인할 것

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
- [x] 1단계: 기본 입력 폼 + 실시간 계산 (수입, 비용 항목 동적 추가, 결과 카드) — **비용 항목 입력행은 모바일 1열 스택, 결과 카드는 모바일 1~2열 wrap으로 처음부터 구현**
- [x] 2단계: 실질 시급 계산 (투입 시간 입력 시)
- [x] 3단계: 업종별 평균 마진율 비교 코멘트 (`industryPresets` 연동)
- [x] 4단계: 견적서 생성기 결과 화면과 연결 ("이 견적으로 손익 계산해보기" 버튼)
- [x] 5단계: 비용 항목 비중 시각화 — 가로 스택 바 차트로 구현(아래 참고) — 모바일에서 차트 크기/범례 배치 확인

#### 구현 메모 (1단계)

- 라우트: `src/app/tools/profit-calculator/page.tsx`(메타데이터/인트로) + `ProfitCalculatorClient.tsx`(폼·계산) + `page.module.css`. API/서버 로직 없이 완전 클라이언트 사이드 계산(기술 구현 방향 원칙대로)
- 입력 항목: 수입(필수) / 내 인건비(비용 포함 여부 체크박스 + 직접입력·시간×단가 토글) / 외주·협업자 비용(동적 행 추가/삭제) / 기타 경비(동적 행 추가/삭제) / 플랫폼 수수료(비율%·정액 토글)
- 계산은 모든 입력 필드에서 파생된 값으로 즉시 렌더링(React state, 별도 "계산하기" 버튼 없음)
- 결과 카드는 문서 설계상 3개 지표(순이익/마진율/실질시급) 중 실질 시급은 2단계 항목이라 이번 단계에서는 제외하고, 대신 총 비용/순이익/마진율 3개 카드로 구성 — 총 비용은 이미 계산되는 중간값이라 별도 기능 추가 없이 표시
- 모바일 대응: 동적 비용 입력행(`.dynamicRow`)은 640px 미만에서 세로 스택, 그 이상에서 가로 배치. 결과 카드(`.resultGrid`)는 `auto-fit`/`minmax(140px, 1fr)`로 모바일 1~2열 → 데스크톱 3열 자동 wrap. 데스크톱(1024px 이상)에서는 폼과 결과 카드를 2열로 배치하고 결과 카드에 `position: sticky` 적용
- 헤더 내비게이션(`src/components/Header.tsx`)에 "손익 계산기" 링크 추가 (데스크톱/모바일 메뉴 모두)
- 브라우저(Chrome, 데스크톱 1400px·모바일 390px)에서 직접 값 입력해 계산 결과·동적 행 추가/삭제·순이익 음수(빨간색 표시) 케이스를 확인함. 최초 구현 시 결과 카드 금액이 좁은 화면에서 숫자 중간이 줄바꿈되는 문제가 있어 `minmax` 최소폭을 140px로 늘리고 `metricValue` 폰트 크기에 `clamp()`를 적용해 수정

#### 구현 메모 (2단계 — 실질 시급)

- `ProfitCalculatorClient.tsx`: "실제 투입 시간 (선택)" 입력 필드를 플랫폼 수수료 아래에 추가. `investedHours` 값이 0보다 클 때만 `hourlyProfit = netProfit / investedHours`를 계산
- 결과 카드는 문서 설계("미입력 시 해당 카드는 숨김 처리")대로 투입 시간을 입력하지 않으면 "실질 시급" 카드 자체가 렌더링되지 않음(조건부 렌더링) — 음수일 때는 다른 지표와 동일하게 빨간색 표시
- 브라우저에서 투입 시간 미입력 → 카드 숨김, 투입 시간 입력 → 카드 표시 및 계산값(4,000,000원 순이익 ÷ 40시간 = 100,000원) 정상 확인

#### 구현 메모 (3단계 — 업종 평균 마진율 비교)

- `src/lib/quotePresets.ts`: `IndustryPreset`에 `avgMarginRange: [number, number]`(%) 필드 추가. 일당 캡과 마찬가지로 공인 통계가 아닌 참고용 추정치이며, 결과 화면에 항상 "참고용" 문구를 함께 노출하도록 주석에 명시 — web_dev [30,40] / design [35,50] / marketing [20,35] / video [25,40]
- `ProfitCalculatorClient.tsx`: 견적서 생성기와 동일한 `INDUSTRY_PRESETS`/`INDUSTRY_OPTIONS`를 재사용(문서의 "견적서 생성기와 기준 데이터 공유 가능" 방침대로 별도 프리셋 파일을 새로 만들지 않음). 업종 선택 UI는 모바일 가이드대로 드롭다운 대신 칩(버튼) 그룹으로 구현, 기본값은 첫 번째 업종(웹/앱 개발)
- 마진율이 계산되면(`hasIncome`) `getMarginComment()`가 선택 업종의 `avgMarginRange`와 비교해 "낮아요/범위 안에 있어요/높아요" 3가지 코멘트를 결과 카드 아래에 표시. 항상 "* 업종 평균은 참고용 추정치이며 실제 통계와 다를 수 있어요" 문구를 함께 노출
- 브라우저에서 업종 칩 전환 시 코멘트가 즉시 갱신되는지, 마진율이 범위 미만/범위 내/범위 초과 3가지 케이스 모두 올바른 문구로 표시되는지 확인함

#### 구현 메모 (4단계 — 견적서 생성기 결과 연결)

- `QuoteGeneratorClient.tsx` 결과 화면에 `next/link`로 "📊 이 견적으로 손익 계산해보기" 버튼 추가. `total_min`/`total_max`의 평균값과 선택된 `industry`를 쿼리스트링(`/tools/profit-calculator?income=...&industry=...`)으로 전달 — 서버 저장 없이 URL만으로 값을 넘기므로 무저장 원칙과 충돌하지 않음
- `ProfitCalculatorClient.tsx`: `useSearchParams()`로 `income`/`industry` 쿼리를 읽어 각각의 초기 `useState` 값으로 사용. `income`이 넘어온 경우 입력 필드 위에 "AI 견적서 생성기 결과의 견적 범위 평균값을 가져왔어요. 실제 계약 금액에 맞게 수정하세요." 안내(`noteBox`, 위저드 노트와 동일 스타일)를 표시해 자동 입력된 값임을 알림
- Next.js에서 `useSearchParams()`는 정적 페이지에서 Suspense 경계 없이 쓰면 빌드 경고/에러가 나므로, `page.tsx`에서 `<Suspense fallback={null}>`로 `ProfitCalculatorClient`를 감쌈 — 감싼 뒤에도 `next build` 결과 `/tools/profit-calculator`는 그대로 정적(`○`) 페이지로 유지됨을 확인
- 브라우저에서 `?income=4500000&industry=design` 쿼리로 직접 접속해 수입 자동 입력, 업종 칩 자동 선택, 안내 문구, 마진율 비교 코멘트까지 모두 정상 반영되는지 확인함. 견적서 생성기 쪽 버튼 자체는 `GEMINI_API_KEY`가 로컬에 없어 실제 AI 견적 결과 화면까지 이어지는 end-to-end 플로우로는 확인하지 못함(기존 "로컬 미검증" 사유와 동일) — 타입체크·빌드만 통과 확인

#### 구현 메모 (5단계 — 비용 항목 비중 시각화)

- **차트 형태를 "도넛"에서 "가로 100% 스택 바"로 변경**: `/dataviz` 스킬(part-to-whole 데이터의 기본 폼 가이드)을 따름 — 파이/도넛보다 스택 바가 비율 비교에 더 정확하고, 모바일 폭에서도 레이아웃이 안정적이라 판단. 문서상 "도넛 차트 등, 선택"으로 형태가 예시였을 뿐이라 원칙에 맞게 대체
- 카테고리: 내 인건비 / 외주·협업자 비용 / 기타 경비 / 플랫폼 수수료 — 금액이 0원인 항목은 자동 제외, 유효 항목이 2개 미만이면 차트 자체를 숨김(1개만 있으면 비중 정보로서 의미가 없어서)
- 색상: `src/app/globals.css`에 `--chart-series-1~4`(카테고리 고정 순서: 블루/오렌지/아쿠아/옐로우, 라이트·다크 각각) 추가 — dataviz 스킬의 검증된 기본 팔레트 앞 4개 슬롯을 그대로 사용하고 `scripts/validate_palette.js`로 라이트(`#ffffff`)·다크(`#1e293b`) 실제 카드 배경 기준 재검증 통과(라이트 모드 아쿠아·옐로우는 대비 WARN → 범례에 항상 텍스트 라벨을 노출해 relief 조건 충족)
- `ProfitCalculatorClient.tsx`의 `CostBreakdownChart`: 세그먼트는 `flexBasis`로 비율 표현, 세그먼트 사이 2px 간격은 바 배경색이 비치는 방식(마크 스펙의 "surface gap")으로 구현. 각 세그먼트에 `role="img"` + `aria-label`(항목명·금액·비중) 부여, hover/focus 시 밝기 강조 + CSS 툴팁(값은 legend에도 항상 노출되어 툴팁 없이도 확인 가능)
- **버그 수정**: 최초 구현 시 범례를 `grid-template-columns: repeat(auto-fit, minmax(150px,1fr))` 2열로 배치했는데, 값 텍스트가 길 때(`flex:1` 라벨의 flex-basis가 0이라) 라벨 텍스트 폭이 0으로 눌려 완전히 안 보이는 문제 발견 — 브라우저에서 렌더된 화면을 직접 눈으로 보고서야 발견됨(DOM에는 텍스트가 정상적으로 존재해 `get_page_text`로는 문제가 안 드러남). 범례를 세로 1열 목록(`flex-direction: column`)으로 변경해 해결
- Chrome에서 라이트/다크 모드, 데스크톱 폭 모두에서 세그먼트 비율·범례 라벨/값/퍼센트가 올바르게 표시되는지 확인. 리사이즈 도구가 이 세션에서 실제 모바일 폭으로 창을 줄이지 못해(반복 시도했으나 데스크톱 폭으로 되돌아감) 390px 실측 스크린샷으로는 최종 검증하지 못함 — 다만 범례를 세로 목록으로, 바를 `flex` 기반 100% 너비로 구현해 고정 픽셀 폭에 의존하지 않으므로 좁은 화면에서도 깨지지 않을 것으로 판단(1~3단계에서 이미 검증된 동일 패턴). **다음 세션에서 실제 모바일 폭 스크린샷으로 재확인 권장**

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
| PDF 생성 (견적서 export) | `@react-pdf/renderer` 시도했으나 Next.js App Router 호환성 문제로 제외 (구현 메모 4단계 참고) | ❌ 제외됨 |
| Rate limiting | `src/middleware.ts`, DB 없이 in-memory 방식 | ✅ 구현됨 |
| 환경변수 | `GEMINI_API_KEY` (.env.local 필요) | — |

> 참고: 기존 사이트에서 Supabase는 블로그 포스트 관리용으로는 계속 사용하되, 이 견적서 생성기 기능에서는 사용하지 않음.

## 작업 시 참고 사항

- 기존 사이트에 이미 다크모드, 카테고리 구조(AI Apps/Biz)가 있으므로 신규 기능도 이 톤앤매너에 맞출 것
- Supabase 클라이언트는 서버/클라이언트 분리해서 사용 (`@supabase/ssr` 패키지 활용) — 단, 견적서 생성기 기능 자체에는 Supabase 미사용
- 새 기능은 별도 라우트로 구성 권장 (예: `/tools/quote-generator`)
- **AI 분석 엔진은 Gemini API로 통일**할 것 (Anthropic API 사용하지 않음) — 견적 분석, 위저드 요청서 생성 모두 동일하게 적용
- 위저드 경로와 업로드/붙여넣기 경로는 최종적으로 동일한 "견적 분석 API"로 합류하는 구조 유지 (분기는 입력 단계에서만)
- **DB 저장 지양 원칙 준수**: 사용자가 업로드/입력한 요청서 내용과 AI 분석 결과는 어떤 형태로도 서버에 영속 저장하지 않음. 새 기능을 추가할 때도 이 원칙을 기본값으로 유지하고, 저장이 필요해 보이는 요구사항이 생기면 먼저 "정말 저장해야 하는가"를 검토할 것


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

### 2026-08-18
- **무료 툴 홍보 배너(1단계) 구현**: `nexalab_banner_지침서.md` 지침에 따라 메인 히어로 섹션(`AI가 써내려가는 다음 이야기` 문구 아래, Live Sub-Apps 섹션 위)에 AI 견적서 생성기 홍보 배너 추가
  - 신규 `src/components/ToolPromoBanner.tsx` + `ToolPromoBanner.module.css`: 지침서 확정 카피 그대로 사용(데스크톱: 메인/서브 카피 + "놓치지 않는 견적서 만들기 →", 모바일 압축: "견적서, 항목 빠뜨리셨나요?" + "지금 확인 →"), 클릭 시 `/tools/quote-generator`로 이동
  - 다크모드 대응은 기존 CSS 변수(`--accent-color`, `--glass-bg` 등) 그대로 활용, hover 시 scale(1.02)만 적용(지침서 5번 가이드 준수)
  - (당시) 손익 계산기 페이지가 없어 AI 견적서 카드만 우선 반영 — 아래 같은 날짜 후속 작업에서 손익 계산기 페이지 구현 후 2카드로 확장 완료
  - **미구현(다음 단계, 지침서 우선순위 2~4)**: Live Sub-App 카드 옆 배지/툴팁, 포스트 상세 페이지 하단 시리즈 콘텐츠 배너, Exit Intent 팝업
- **손익 계산기(`/tools/profit-calculator`) 구현 — 이후 origin/main 버전과 병합 충돌, origin/main 버전으로 대체됨**
  - 이 세션에서는 `nexalab_profit_calculator_지침서.md`(월 매출액·매입원가 기반 범용 손익 계산기, `src/lib/profitCalculator.ts` + dataviz 스킬로 검증한 스택 막대 차트) 기준으로 먼저 구현·검증 완료했으나, 같은 날 origin/main에 별도 세션에서 만든 "프로젝트 손익 계산기"(계약금액 + 투입비용 기반, `src/lib/quotePresets.ts`의 업종 프리셋 재사용, 노동비 직접입력/시급×시간 모드, 외주비 등 동적 비용 항목, 업종 평균 마진 비교)가 먼저 push되어 있었음
  - `git pull` 시 두 구현이 같은 경로(`page.tsx`/`ProfitCalculatorClient.tsx`/`page.module.css`)를 두고 충돌 → 사용자 확인 후 **origin/main 버전을 최종 채택**, 이 세션의 `src/lib/profitCalculator.ts`는 삭제(더 이상 참조되지 않음)
  - `ToolPromoBanner`(2카드: AI 견적서 + 손익 계산기, 배너 지침서 확정 카피 그대로 사용)는 그대로 유지 — `/tools/profit-calculator` 링크는 동일하므로 코드 변경 없이 origin/main의 새 구현으로 자연스럽게 연결됨. 다만 배너 카피("이번 달 손익, 아직도 엑셀로 계산하세요?")는 월 매출 기준 문구라 계약 기반 프로젝트 손익 계산기와는 결이 살짝 다를 수 있어, 필요하면 추후 카피 재검토
  - 이번 세션에서 검증했던 항목(실시간 계산, 손실 시나리오, localStorage, 라이트/다크 모드)은 origin/main 버전에는 재검증하지 않았으므로 다음 작업 시 별도 확인 필요
- **다국어(한국어/영어) 기능 추가**: `next-intl` 도입, URL 경로 분리 방식(`/ko/...`, `/en/...`) 채택
  - `src/app/*`(layout/page/about/ai-apps/biz/posts/tools) 전체를 `src/app/[locale]/*`로 이동. `src/app/api`, `src/middleware.ts`, `src/app/icon.svg`, `src/app/not-found.tsx`는 로케일 세그먼트 밖에 유지
  - `src/i18n/routing.ts`(locales: ko/en, defaultLocale: ko, localePrefix: always) + `request.ts` + `navigation.ts`(로케일 인식 `Link`/`usePathname`/`useRouter`), `next.config.mjs`를 `createNextIntlPlugin`으로 래핑
  - `src/middleware.ts`: 기존 rate-limit 로직(`/api/quote`, `/api/wizard-to-request`)은 그대로 두고, 나머지 페이지 경로에 대해서만 next-intl의 `createMiddleware(routing)` 실행하도록 분기. matcher에 next-intl 권장 패턴(`/((?!api|_next|_vercel|.*\\..*).*)`) 추가
  - 번역 범위는 **UI 문구만** — 헤더/푸터/히어로/배너/About·AI Apps·Biz 소개 페이지/AI 견적서 생성기(위저드 포함)/손익 계산기 UI 전체를 `messages/ko.json` · `messages/en.json`으로 분리. Supabase에서 가져오는 블로그 글 제목·본문·카테고리명은 원문(한국어) 그대로 두 로케일 모두에 노출(번역 안 함) — 사용자 확인된 범위
  - Hero/About/AI Apps/Biz/AI 견적서/손익 계산기 타이틀의 강조 span은 `t.rich()`로 처리해 언어별 어순이 달라도(`AI가 써내려가는 다음 이야기` ↔ `The Next Story, Written by AI`) 강조 위치가 자연스럽게 붙도록 함
  - `src/lib/formatCurrency.ts` 신규: `formatWon(amount, locale)` — ko는 `"1,234원"`, en은 `"₩1,234"` 형식으로 통일해서 견적서/손익 계산기 양쪽에서 재사용
  - `ArticleHeader`의 `readTime`(기존 `"8분"` 문자열 하드코딩) → `readTimeMinutes`(숫자)로 변경하고 `postDetail.readTimeSuffix`/`viewsSuffix` 메시지로 단위까지 로케일에 맞게 포맷
  - Header에 언어 전환 버튼 추가(`locale === 'ko' ? 'EN' : '한'` 토글) — `next-intl` `Link`의 `locale` prop으로 현재 경로를 유지한 채 전환
  - **번역 제외 범위**(사용자 확인): AI 견적서/요청서 위저드가 Gemini API에 보내는 프롬프트 컨텍스트(`quotePresets.ts`의 `promptContext`/`sampleTasks`)와 서버(`route.ts`) 에러 메시지는 번역하지 않고 한국어 유지 — AI 백엔드 동작을 로케일별로 분기하는 것은 이번 범위 밖
  - 검증: `npx tsc --noEmit`, `next lint`, `next build`(정적 페이지 76개, `/ko`·`/en` 양쪽 전부 생성 확인) 통과. 브라우저로 `/ko`·`/en` 홈, AI 견적서(랜딩+위저드), 손익 계산기(입력~결과~업종평균 비교 문구), 블로그 상세(UI만 영어, 본문은 한국어 유지) 확인, 언어 전환 버튼으로 현재 페이지 유지한 채 왕복 확인, 라이트/다크 모드 모두 확인
  - **미구현/향후 과제**: 블로그 글 자체의 다국어 번역(DB 스키마 확장 또는 AI 번역 파이프라인 필요), API 에러 메시지 로케일화, `opengraph-image.tsx`의 alt 텍스트("NexaLab 포스팅 대표 이미지")는 미번역 상태로 남음
- **카테고리를 언어별로 분리**: 기존 카테고리(AI Applications, Business & Ideas)는 한국어 글 전용, 앞으로 추가할 카테고리(직무별 최신 AI 뉴스)는 영어 글 전용으로 운영
  - `categories` 테이블에 `locale`('ko'|'en') 컬럼 필요 — 신규 `supabase-categories-locale.sql` 작성해뒀으나, 실제 DB에는 이미 해당 컬럼이 존재하고 기존 카테고리 2개 모두 `locale='ko'`로 설정되어 있는 것을 확인함(사용자가 사전에 대시보드에서 추가한 것으로 보임). 새 SQL은 다른 환경에 동일하게 세팅할 때 참고용으로 남겨둠(재실행해도 안전하도록 `IF NOT EXISTS`/`DROP ... IF EXISTS` 패턴 사용)
  - `src/app/[locale]/page.tsx`: `getCategories`/`getPosts`에 `locale` 파라미터 추가, `categories.eq('locale', locale)` / `posts.select('*, categories!inner(...)').eq('categories.locale', locale)`로 카테고리 탭·글 목록을 현재 로케일 것만 노출하도록 필터링(전체 29개 글이 전부 category_id를 가지고 있어 inner join으로 필터링해도 누락되는 글 없음을 사전에 확인)
  - `src/app/[locale]/posts/[id]/page.tsx`: 글의 카테고리 언어와 현재 URL 로케일이 다르면 `notFound()` — 예를 들어 한국어 글 URL을 `/en/posts/...`로 열면 404 처리되어 언어가 섞여 보이지 않음
  - 브라우저로 확인: `/ko`는 기존과 동일하게 카테고리 탭 2개 + 29개 글 정상 노출, `/en`은 카테고리 탭 없이 "No posts yet." 빈 상태로 정상 노출(아직 영어 카테고리/글이 없으므로 예상된 동작), 한국어 글을 `/en/posts/...`로 직접 접근 시 404 확인
  - **다음 단계(사용자 작업)**: Supabase 대시보드에서 `locale='en'`인 새 카테고리 생성 후 그 카테고리로 영어 AI 뉴스 글을 작성하면 `/en` 홈에 자동으로 노출됨 — 앱 코드 추가 변경 불필요

### 2026-08-19
- **관리자 로그인 + 글 수동 등록 기능(`/admin`) 신규 구현**: 지금까지 `posts` 테이블에 앱 코드로 쓰는 경로가 전혀 없어(글 작성/수정은 Supabase 대시보드 Table Editor에서 직접 해옴, `supabase-rls.sql`도 공개 SELECT 정책만 존재) 로그인한 관리자가 글을 생성/수정/삭제할 수 있는 영역을 추가함
  - **인증**: Supabase Auth(이메일/비밀번호) + `@supabase/ssr`(신규 의존성 추가) 쿠키 세션. `src/lib/supabase/client.ts`(브라우저), `server.ts`(RSC/Route Handler, `getUser()` 확인용), `middleware.ts`(`updateSession()` 헬퍼, 세션 쿠키 갱신 담당) 3개 신설 — 기존 anon 클라이언트 `src/lib/supabase.ts`는 공개 페이지용으로 그대로 유지
  - **DB 쓰기**: `src/lib/supabase/admin.ts` 신설 — service-role 키 클라이언트, `server-only` 패키지(신규 의존성)로 감싸 클라이언트 번들에 실수로 포함되면 빌드가 실패하도록 함. RLS 정책은 변경하지 않고(공개 SELECT만 유지) 그대로 우회하는 방식 채택 — draft(비공개) 글도 관리자 목록·수정 화면에서 조회해야 하기 때문
  - **라우트 구조**: `/admin`은 `src/app/[locale]/**` 밖에 위치(`src/app/api`, `not-found.tsx`와 동일 패턴). `[locale]/layout.tsx`가 유일한 `<html><body>` 루트라 `src/app/admin/layout.tsx`가 자체 root layout을 가짐(ThemeProvider만 재사용, next-intl 미적용 — 관리자 UI는 한국어 고정). `(protected)` 라우트 그룹으로 `/admin/login`과 실제 관리 화면을 분리해 리다이렉트 루프 방지
  - **이중 인증 방어**: `src/middleware.ts`에 `/admin/:path*` 분기 추가 — `updateSession()`으로 세션 갱신 후 미로그인 시 `/admin/login`으로, 로그인 상태에서 `/admin/login` 접근 시 `/admin/posts`로 리다이렉트(1차 게이트). `(protected)/layout.tsx`에서도 서버 컴포넌트 레벨로 `getUser()` 재확인(2차 방어). API route(`/api/admin/posts`, `/api/admin/posts/[id]`)도 각 요청마다 독립적으로 `getUser()` 검증 후에만 service-role 클라이언트로 insert/update/delete 수행 — 미들웨어 우회 대비 마지막 방어선. next-intl 대상 matcher에도 `admin` 제외 추가(`/((?!api|admin|_next|_vercel|.*\\..*).*)`)해 `/admin`이 `/ko/admin`으로 리다이렉트되지 않도록 함
  - **글 작성 폼**: `src/components/admin/PostForm.tsx`(생성/수정 공용) — 제목/요약/본문(태그는 콤마 구분 입력 → 배열 변환)/카테고리(칩 버튼, 한국어·영어 그룹 분리 표시)/게시 여부 체크박스(기본값 미체크=초안, 실수로 바로 공개되는 것 방지). 본문은 새 에디터 라이브러리를 추가하지 않고 textarea + "미리보기" 탭에서 기존 글 상세 페이지와 동일한 `ReactMarkdown + remarkGfm + rehypeHighlight` 파이프라인으로 렌더링해 실제 표시와 100% 동일하게 보이도록 함
  - API route(`src/app/api/admin/posts/route.ts`, `[id]/route.ts`)는 `src/lib/postSchema.ts`(zod)로 요청 본문을 검증한 뒤 저장하고, 성공 시 `revalidatePath`로 홈(`/ko`, `/en`)과 해당 글 상세 경로를 즉시 재검증(ISR 60초 대기 없이 바로 반영)
  - `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` 빈 값 플레이스홀더 추가(로컬에 이전까지 `GEMINI_API_KEY`만 존재했음)
  - **사용자 확인/작업 필요**:
    1. Supabase 대시보드 > Authentication > Users에서 관리자 계정 1개 직접 생성(이메일/비밀번호, "Auto Confirm User" 체크)
    2. `.env.local`과 Vercel 프로젝트 설정에 위 세 환경변수 실제 값 채우기(Supabase 대시보드 > Settings > API)
  - **검증**: `npx tsc --noEmit`, `next lint`, `next build`(정적 28페이지 + 신규 admin 라우트 전부 생성 확인, `/admin`·`/api/admin/posts`·`/api/admin/posts/[id]`는 예상대로 `ƒ`(Dynamic) 처리됨) 통과.
  - **버그 수정 (브라우저 검증 중 발견)**: 사용자가 실제 Supabase 환경변수를 채운 뒤 로그인~글 등록까지 테스트하자 `POST /api/admin/posts`가 500 에러(`null value in column "slug" of relation "posts" violates not-null constraint`) — 애초 스키마 조사 때 `posts.slug` NOT NULL 컬럼을 놓쳤음(공개 쿼리들이 `select('*')`만 쓰고 slug를 참조한 적이 없어 발견 못 함). `src/app/api/admin/posts/route.ts`에 `generateSlug(title)` 헬퍼 추가(제목 기반 + `randomUUID().slice(0,8)` 접미사로 유니크 보장)해서 insert 시 함께 채우도록 수정 — 공개 라우팅은 `/posts/[id]`로 id 기반이라 slug 값 자체는 노출되지 않음
  - **브라우저 end-to-end 검증 완료**(Chrome 자동화, dev 서버): 로그인 → 새 글 작성(제목/카테고리 칩/요약/마크다운 본문+미리보기 탭/태그/공개 체크박스) → 저장 → 홈(`/ko`) 피처드 포스트로 즉시 반영 확인 → 상세 페이지(`/ko/posts/[id]`) 렌더링 확인 → 수정(제목 변경) → 상세 페이지 즉시 반영 확인 → 삭제 → 목록에서 즉시 사라짐 + 상세 페이지 404 확인 → 로그아웃 → `/admin/posts` 재접근 시 `/admin/login`으로 리다이렉트 확인. 전 과정에서 `revalidatePath` 즉시 반영, 이중 인증 가드(middleware + `(protected)/layout.tsx`) 모두 의도대로 동작

### 2026-08-20
- **llms.txt 자동 생성기(`/tools/llms-txt-generator`) 신규 구현** (`nexalab_llms-txt_생성기_지침서.md` 기준) — SEO/GEO 체커에서 "llms.txt 없음" 진단을 받은 방문자가 그 자리에서 바로 만들 수 있게 하는 전환형 도구
  - `src/lib/llmsTxtGenerator.ts`(신규, Node/DOM 의존성 없는 순수 함수): `generateLlmsTxt()`가 입력값을 지침서 4-1 템플릿(H1 사이트명 → `>` 요약 → `_Last updated_` 줄 → 카테고리별 `##` 섹션 → `## Optional` 연락처)으로 조합. `escapeMarkdown()`으로 제목/카테고리/설명의 `[`, `]`, `(`, `)`를 이스케이프하고, `normalizeUrl()`로 상대경로를 사이트 URL 기준 절대경로로 변환. 페이지가 없는 카테고리·title/url이 빈 페이지는 자동으로 결과에서 제외
  - 지침서 4-1 템플릿에는 없지만 입력 필드 표(3번 항목)에는 있던 "마지막 업데이트일"은, 요약 아래에 `_Last updated: {날짜}_` 한 줄로 추가하는 절충안으로 구현(표준 포맷과 충돌하지 않으면서 필드를 실제로 반영)
  - `src/app/[locale]/tools/llms-txt-generator/`: `page.tsx`(메타데이터/JSON-LD, 기존 도구 페이지들과 동일 패턴) + `LlmsTxtGeneratorClient.tsx`(입력 폼 → 생성 → 결과 화면 2단계 클라이언트 컴포넌트, 서버 호출 없이 전량 클라이언트에서 처리) + `page.module.css`
  - 입력 폼: 사이트명/URL/한 줄 요약(200자 카운터)/핵심 콘텐츠 카테고리(콤마 구분 텍스트 — 기존 관리자 글쓰기 폼의 태그 입력 패턴 재사용)/주요 페이지 리스트(제목+URL+설명+카테고리 select, 최대 10개, 카테고리 미입력 시 추가 버튼 비활성화)/연락처 링크(선택)/마지막 업데이트일(오늘 날짜 기본값, 수정 가능). 모바일 반응형 공통 가이드대로 페이지 입력행은 768px 미만에서 1열 세로 스택, 그 이상에서 그리드 한 줄 배치
  - 결과 화면: 생성된 텍스트를 모노스페이스 `<pre>` 미리보기로 표시, 복사하기(Clipboard API, 2초간 "✅ 복사됨" 피드백)/다운로드(`Blob` + `URL.createObjectURL`, 파일명 `llms.txt`) 버튼, 배치 안내 문구, "SEO/GEO 체커로 다시 점검하기" 링크, "입력값 수정하기"(폼으로 복귀, 값 유지)
  - **SEO/GEO 체커 연동**: `SeoGeoCheckerClient.tsx`의 `CheckRow`에 `geo.llms_txt.exists` 체크가 `fail` 상태일 때만 노출되는 "지금 만들기 →" CTA 버튼 추가 — 점검한 URL의 hostname(`www.` 제거)을 `site`, URL 전체를 `url` 쿼리 파라미터로 실어 `/tools/llms-txt-generator`로 전달. 생성기 쪽에서 `useSearchParams()`로 읽어 사이트명/URL을 자동 프리필하고 "SEO/GEO 체커 결과에서 넘어온 값을 자동으로 채워뒀어요" 안내 노출(손익 계산기의 기존 쿼리 프리필 패턴과 동일)
  - Header 네비게이션(데스크톱/모바일)에 "llms.txt 생성기" 링크 추가
  - `messages/ko.json`·`messages/en.json`에 `llmsTxtGenerator` 네임스페이스 전체 번역 추가, `seoGeoChecker.llmsTxtCtaButton` 키 추가, `header.navLlmsTxtGenerator` 추가
  - 이 기능은 지침서 6번 항목대로 서버 API 라우트나 캐싱/rate-limit이 전혀 없음 — 견적서 생성기·손익 계산기와 달리 Gemini API도 호출하지 않는 순수 클라이언트 사이드 도구
  - **검증**: `npx tsc --noEmit`, `next lint`, `next build`(`/ko`·`/en` 양쪽 `/tools/llms-txt-generator` 정적 생성 확인) 통과. 브라우저(Chrome 자동화, dev 서버)로 폼 입력 → 생성 → 미리보기 텍스트가 템플릿 형식과 일치하는지(상대경로 페이지 URL이 절대경로로 정규화됨 포함) → 복사하기 피드백 확인. 쿼리 파라미터(`?site=&url=`)로 직접 접속해 프리필 동작 확인. `/en` 로케일과 다크모드 렌더링 확인. SEO/GEO 체커 CTA 버튼 자체는 로컬 dev 서버가 `safeFetch`의 localhost 차단 정책(SSRF 방지) 때문에 자기 자신을 점검할 수 없어 실제 클릭까지는 검증하지 못함 — 코드 로직(체크 id/상태 조건, 쿼리 구성)만 리뷰로 확인. **다음 세션에서 외부 배포 URL 대상으로 SEO/GEO 체커 → CTA 버튼 클릭 → 생성기 프리필까지 이어지는 전체 플로우 재확인 권장**

- **통합 대시보드(`/dashboard`, "내 사업 건강검진표") 신규 구현** (`nexalab_통합대시보드_지침서.md` 기준) — 견적서·손익계산기·SEO/GEO체커 3개 도구의 최근 결과를 한 화면에 모아 보여주는 허브 페이지. 신규 기능 개발이 아니라 지침서 표현대로 "기존 3개 도구의 결과 데이터를 재구성"하는 작업
  - **데이터 저장 방식**: 지침서 4번 표에서 제시한 두 옵션(A. 로컬 스토리지 / B. 이메일 연동) 중 지침서가 명시적으로 추천한 **옵션 A(로컬 스토리지)**로 구현 — 회원 시스템이 없는 현재 구조와 맞고, "다음 액션 아이템"에서도 확정 여부만 확인하라고 되어 있어 별도 확인 없이 추천안대로 진행. 옵션 B(이메일 연동 저장)는 이번 범위에서 구현하지 않음
  - `src/lib/dashboardHistory.ts`(신규): localStorage 기반 히스토리 read/write 헬퍼. 지침서 7번 항목의 저장 키 설계(`nexalab_quote_history`, `nexalab_profit_history`, `nexalab_seo_history`)를 그대로 사용, 도구별 최근 5건만 유지. `id`가 같은 항목은 교체(업서트)하는 `pushHistoryEntry()`로 구현해 손익 계산기처럼 실시간 재계산되는 도구에서도 항목이 무한정 쌓이지 않게 함. llms.txt 생성 여부는 히스토리 배열이 아니라 `nexalab_llmstxt_generated_at` 단일 타임스탬프 플래그로 별도 관리(5번 CTA 규칙의 "llms.txt 미생성" 조건 판별용)
  - **3개 기존 도구에 저장 훅 추가** (지침서 7번 "기존 코드 충돌 시" 항목이 선행 작업으로 지목한 부분):
    - `QuoteGeneratorClient.tsx`: `/api/quote` 성공 응답(`setQuote` 직후)에 `saveQuoteHistory()` 호출. 견적서에는 "프로젝트명" 필드가 없어(요청서 원문에서 AI가 자유 텍스트로 분석하는 구조), AI 응답의 `summary` 필드를 카드 제목 대용으로 저장(없으면 첫 견적 항목명, 그것도 없으면 빈 문자열 → 대시보드에서 fallback 문구로 대체)
    - `SeoGeoCheckerClient.tsx`: `/api/seo-check` 성공 응답(`setResult` 직후)에 `saveSeoHistory()` 호출 — url/SEO·GEO 점수·등급 저장
    - `ProfitCalculatorClient.tsx`: 이 도구만 유일하게 "계산하기" 버튼이 없는 완전 실시간 계산 구조라, 매 입력마다 히스토리를 쌓지 않도록 `useRef`로 세션 고정 id를 만들고 `useEffect` + `setTimeout` 1.2초 디바운스로 값이 잠잠해진 뒤 한 번만 `saveProfitHistory(entry, sessionId)`를 업서트 저장하도록 구현(같은 세션 내 재조정은 새 항목이 아니라 갱신으로 처리)
    - `LlmsTxtGeneratorClient.tsx`: `generateLlmsTxt()` 성공 직후 `markLlmsTxtGenerated()` 호출
  - `src/app/[locale]/dashboard/page.tsx`(신규, 서버 컴포넌트): 메타데이터/ISR(`revalidate = 60`, 홈과 동일 전략 — "최근 블로그 글" 섹션 신선도 유지), Supabase에서 로케일 필터링된 최근 발행 글 3개(`getRecentPosts`)와 5번 CTA 규칙 중 "SEO 점수만 낮고 GEO는 양호" 항목이 연결할 후보 글(`getSeoRelatedPost`, `tags` 배열이 `SEO`/`GEO`/`SEO/GEO`와 겹치는 최신 글 1개, `.overlaps()` 사용)을 서버에서 조회해 클라이언트 컴포넌트에 props로 전달. 로컬스토리지는 서버에서 읽을 수 없으므로 이 부분만 서버가 담당하는 구조
  - `src/app/[locale]/dashboard/DashboardClient.tsx`(신규): `useEffect`로 마운트 후 4개 로컬스토리지 소스를 읽어 state에 채움(초기값은 서버 렌더와 동일한 빈 배열/null이라 hydration mismatch 없음). 구성 섹션은 지침서 3-2 와이어프레임 그대로:
    - 인사말 헤더(👋) → 3개 도구 카드(빈 상태/데이터 상태, 지침서 3-3 표 그대로) → 트렌드(SEO/GEO 점수·순이익이 직전 항목 대비 변화가 있을 때만, 최소 2건 이상 히스토리 필요) → 도구 간 추천 CTA(5번 규칙표 4개 조건 전부 구현, 아래 참고) → 최근 블로그 글(글이 있을 때만, 기존 `PostCard` 컴포넌트 재사용)
    - 지침서 7번 "빈 상태 처리: 세 도구 모두 미사용 시 온보딩형 안내 화면"은 카드별 개별 empty state(3-3 표)와 별개로, 3개 모두 비어있을 때만 카드 그리드 위에 추가로 온보딩 배너를 노출하는 방식으로 두 요구사항을 함께 충족
  - **5번 "도구 간 자동 연결 CTA" 규칙표 구현**: 4개 조건 모두 단순 조건문으로 구현(지침서가 "복잡한 알고리즘이 아니라 조건문 수준으로 충분"이라고 명시한 대로)
    1. `latestSeo.geoScore < 60` && `llmsTxtGeneratedAt`이 없을 때 → llms.txt 생성기로 연결
    2. `latestProfit.netProfit < 0` → 견적서 생성기로 연결
    3. 최근 견적서(`latestQuote.createdAt`)가 7일 이상 지났을 때(로컬 타임스탬프 기준, 지침서 표현 그대로) → 손익 계산기로 연결
    4. `latestSeo.seoScore < 60` && `latestSeo.geoScore >= 75`(B등급 이상을 "양호"로 정의) && `getSeoRelatedPost()`로 찾은 글이 있을 때만 → 해당 글로 연결. **매칭되는 글이 없으면 이 추천 자체를 노출하지 않음**(무관한 글에 억지로 연결하지 않기 위한 의도적 설계 — 지침서에 없는 판단이라 여기 기록)
  - **PWA `start_url` 변경**: `src/app/manifest.ts`의 `start_url`을 `"/"` → `"/dashboard"`로 변경 — 지침서 6번 표가 "대시보드로 변경 추천(재방문자에게 더 유용한 진입점)"이라고 명시적으로 권장한 대로 반영. 별도 확인 절차 없이 진행(현재 실사용자가 거의 없는 단계로 판단, PWA 기능 자체가 직전 커밋에서 막 추가된 상태). Header 네비게이션(데스크톱/모바일)에도 "대시보드" 링크를 첫 번째 항목으로 추가
  - **이번 범위에서 구현하지 않은 것** (지침서에 언급되었으나 보류):
    - 6번 표의 "오프라인 대응"(최근 로컬 결과를 오프라인에서도 조회 가능하게) — 현재 `public/sw.js`는 네비게이션 요청에 대해 항상 네트워크 우선(오프라인 시 `offline.html`로만 대체)이라, `/dashboard` 자체를 사전 방문한 적 없는 상태에서 오프라인 진입하면 대시보드 셸이 뜨지 않음. localStorage 데이터 자체는 네트워크와 무관하게 남아있지만, 셸을 오프라인에서도 캐시하려면 서비스워커 캐싱 전략 자체를 바꿔야 해서(현재는 "블로그 글/도구 결과는 자주 바뀌므로 캐싱하지 않는다"는 의도적 설계) 이번 범위에서는 손대지 않음
    - 6번 표의 "알림(Push) 확장 여지" — 지침서 자체가 "지금 단계는 아님"이라고 명시
    - 옵션 B(이메일 연동 저장)로의 확장
  - **검증**: `npx tsc --noEmit`, `next lint`, `next build`(`/ko`·`/en` 양쪽 `/dashboard` 정적 생성 + ISR 확인) 통과. 브라우저(Chrome 자동화, dev 서버, `GEMINI_API_KEY` 설정된 상태로 실제 API 호출 포함) end-to-end 검증: 빈 상태(온보딩 배너 + 3개 카드 empty state + 실제 Supabase 블로그 글 노출) 확인 → 손익 계산기에서 값 입력 후 대시보드 재방문 시 카드에 반영 확인(디바운스 업서트 동작 확인) → SEO/GEO 체커로 실제 프로덕션 사이트(`nexalab.app`, llms.txt 존재해 CTA 미노출 확인)와 `google.com`(llms.txt 없어 CTA 노출 확인, 클릭 시 `?site=google.com&url=...` 쿼리로 llms.txt 생성기 프리필까지 실제 이어짐을 확인 — 지난 세션에 로컬 SSRF 차단으로 못 했던 검증을 이번에 완료) 두 건을 점검해 히스토리 2건 적재 → 대시보드에서 최신 항목이 카드에, 트렌드 섹션에 두 항목 간 SEO/GEO 점수 차이(-34점/-17점)가 정확히 계산되어 표시됨을 확인. `/en` 로케일, 다크모드 렌더링 확인. 도구 간 추천 CTA는 이번 테스트 데이터 조합(GEO 양호·순이익 양수·견적 이력 없음·매칭 블로그 글 없음)에서는 4개 규칙 모두 조건 미충족으로 섹션 자체가 숨겨지는 것까지 확인(의도된 동작). **견적서 생성기 경로(rule 2, 3)와 실제 CTA 노출 케이스는 다음 세션에서 추가 확인 권장**

- **인프라 운영 체크리스트(`nexalab_infra_체크리스트.md`) 착수 — 코드로 구현 가능한 P0/P1/P2 항목만 이번 세션에서 반영**
  - 착수 전 코드 조사 결과, 체크리스트 P0 항목 중 "Gemini 호출 최소화 설계"는 **이미 충족된 상태**임을 확인 — `/api/seo-check`(`src/app/api/seo-check/route.ts`)는 Gemini를 전혀 호출하지 않고 `cheerio` 기반 정적 규칙 분석(`src/lib/seoGeoAnalyzer.ts`)만으로 동작 중 (Gemini는 견적서 생성기·위저드에서만 사용). 별도 조치 불필요
  - **Supabase 헬스체크 크론**(P0): `.github/workflows/supabase-healthcheck.yml` 신규 — 매일 00:00 UTC(+수동 실행) `SUPABASE_URL`/`SUPABASE_ANON_KEY` GitHub Secrets로 REST 엔드포인트에 ping. **사용자 작업 필요**: GitHub repo Settings > Secrets에 두 값 등록
  - **GitHub Actions CI**(P2): `.github/workflows/ci.yml` 신규 — `main` 대상 PR마다 `npm ci` → `npm run lint` → `npm run build`. `.env.local` 없이도(placeholder Supabase 클라이언트 폴백 덕분에) 빌드가 성공하는 것을 로컬에서 직접 확인(`.env.local`을 임시로 치워두고 `next build` 재실행, 이후 원상 복구)했으므로 CI에 별도 시크릿 주입 없이도 통과함
  - **`.env.example` 템플릿**(P1 환경변수 분리 항목의 코드 측 부분): 실제 키 값 없이 4개 변수명(`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`GEMINI_API_KEY`)만 정리. `.gitignore`에 `.env.local`만 등록되어 있어 이 파일은 정상적으로 커밋 추적됨을 확인
  - **SEO/GEO 체커 결과 캐싱**(P1): 사용자가 "공유 결과 페이지 없이 내부 캐싱만"으로 범위를 확정 — `supabase-seo-check-cache.sql`(신규, `supabase-rls.sql`과 동일하게 대시보드 SQL Editor에서 수동 실행하는 방식) + `route.ts` 수정
    - 스키마: `seo_check_cache(id, url, url_hash, seo_score, geo_score, report_json, created_at)`, `(url_hash, created_at desc)` 복합 인덱스. RLS는 anon에 INSERT/SELECT만 허용(UPDATE/DELETE 정책 없음) — 캐시 갱신은 새 행 INSERT 방식이라 기존 행을 고치는 정책 자체가 필요 없음(체크리스트 예시와 동일한 최소 권한 원칙)
    - `route.ts`: 요청 URL(리다이렉트 반영 전, 사용자가 입력한 URL 기준)을 SHA-256 해시해 `url_hash`로 사용 — 캐시 히트 시 `safeFetch` 자체를 스킵하도록 안전 fetch보다 먼저 캐시 조회를 배치. 24시간 이내 캐시가 있으면 즉시 반환(`cached: true`), 없으면 기존 분석 로직을 그대로 실행한 뒤 결과를 새 행으로 INSERT(`cached: false`)
    - 캐시 조회/기록 모두 Supabase 에러를 `throw`가 아니라 `{ data, error }` 구조분해로 처리(기존 `getPosts`/`getCategories` 패턴과 동일) — 캐시 테이블이 아직 없거나 일시 장애여도 분석 자체는 항상 정상 동작(best-effort)
    - **사용자 작업 필요**: Supabase 대시보드 SQL Editor에서 `supabase-seo-check-cache.sql` 실행 — 실행 전까지는 캐시 없이 매번 새로 분석(정상 동작, 성능 이점만 없음)
  - **이번 범위에서 하지 않은 것** (사용자가 명시적으로 보류 선택):
    - Vercel 비동기 접수/폴링 구조 리팩터링 — 조사 결과 현재 `/api/seo-check`는 PageSpeed 같은 느린 외부 API 대신 대상 URL/robots.txt/llms.txt/sitemap.xml만 fetch하며 `maxDuration=10`으로 동작 중이라 체크리스트가 가정한 위험도보다 낮다고 판단해 보류
    - Cloudflare Rate Limiting, SSL/TLS Full(Strict) 확인, Vercel Production/Preview/Development 환경변수 3중 분리 — 전부 각 서비스 대시보드에서만 가능한 계정 설정이라 코드로 구현 불가. 사용자에게 별도 안내(이 문서에는 기록하지 않음, 대화 응답 참고)
    - `posts`/`categories` RLS(`supabase-rls.sql`) — 코드(SQL 파일)는 이미 존재하나, 실제 Supabase 프로젝트에 적용됐는지는 DB 접근 권한이 없어 이번 세션에서 재확인하지 못함. 대시보드에서 직접 확인 필요
  - **검증**: `npx tsc --noEmit`, `next lint`, `next build` 통과(`.env.local` 있는 상태/없는 상태 둘 다). 로컬 dev 서버로 `/api/seo-check`에 실제 프로덕션 URL(`nexalab.app`)을 호출해 캐시 테이블이 아직 없는 상태에서도 200 응답과 정상 리포트가 반환되고, 서버 로그에 캐시 조회/기록 실패가 각각 예상대로 기록되는 것을 확인(graceful degradation 검증). **캐시 히트 시 실제로 `safeFetch`를 건너뛰고 즉시 반환되는지는 `supabase-seo-check-cache.sql`을 실행한 이후에 재확인 필요**

- **인프라 체크리스트 후속: GitHub Secrets 등록 + Supabase 헬스체크 엔드포인트 수정, 사용자 대시보드 작업(SQL 마이그레이션/RLS 확인/Cloudflare) 완료, 그 과정에서 발생한 프로덕션 장애(Bot Fight 모드) 진단·해결**
  - **GitHub Secrets 등록**: `gh secret set`으로 `SUPABASE_URL`/`SUPABASE_ANON_KEY`를 리포지토리 시크릿에 등록(값은 `.env.local`에서 읽어 커맨드라인 인자로만 전달, 터미널 출력에는 노출하지 않음). 등록 직후 `gh workflow run`으로 수동 실행해 검증하는 습관을 들일 것 — 실제로 이번에 버그를 하나 잡아냄(아래)
  - **버그 발견 및 수정 — `supabase-healthcheck.yml`의 `/rest/v1/` 루트 엔드포인트가 401 반환**: 워크플로우를 수동 실행해보니 `{"message":"Secret API key required","hint":"Only secret API keys can be used for this endpoint."}` — 이 프로젝트가 쓰는 `sb_publishable_...` 형식의 새 Supabase API 키 체계에서는 `/rest/v1/` 루트 디스커버리 엔드포인트가 secret 키를 요구하고 publishable(anon) 키로는 401이 남(체크리스트가 예시로 든 curl 커맨드는 구버전 anon-key(JWT) 체계를 가정한 것이라 이 프로젝트엔 안 맞았음). RLS로 공개 SELECT가 허용된 `categories` 테이블을 `?select=id&limit=1`로 가볍게 조회하는 방식으로 변경, 재실행해서 200 확인. **교훈**: Supabase REST 헬스체크를 만들 때 루트 엔드포인트보다 실제 공개 테이블 조회가 새 키 체계와 더 안전하게 호환됨
  - **Vercel 환경변수 3중 분리 재검토**: 대시보드 확인 결과 4개 변수 모두 "Production and Preview"로 묶여 동일 값 공유, Development는 미등록. 체크리스트 원문이 "Preview: 별도 테스트용 키 또는 동일 키 + 낮은 쿼터 주의"를 명시적으로 허용하고, Development는 로컬 `.env.local` 사용을 전제로 하고 있어(이 프로젝트는 `vercel env pull`을 쓰지 않음) **현재 상태가 이미 체크리스트 최소 기준을 충족한다고 판단** — 사용자 확인 후 변경하지 않음. 진짜 분리(별도 Supabase 프로젝트/별도 Gemini 키)는 새 리소스 생성이 필요해 별도 결정 사항으로 남겨둠
  - **사용자가 대시보드에서 직접 완료**: `supabase-seo-check-cache.sql` 실행(SQL Editor), `posts`/`categories` RLS 확인, Cloudflare Rate Limiting 규칙 생성 + Bot Fight 모드 ON + SSL/TLS 확인
  - **🔴 프로덕션 장애 발생 및 해결 — `/api/seo-check`가 Cloudflare 단계에서 502를 반환**: 위 Cloudflare 설정 직후 검증하던 중 `/tools/seo-geo-checker`가 실제 브라우저에서도(curl뿐 아니라) 매번 502로 실패하는 것을 발견. 같은 오리진의 `/api/quote`는 정상(400)이고 홈페이지도 정상이라 `/api/seo-check`에만 적용된 무언가가 원인으로 좁혀짐
    - 1차 가설(오답): 새로 만든 Rate Limiting 규칙(`seo-check-rate-limit`, `/api/seo-check` 대상, 5회/10초 차단)이 원인이라 추정 → 사용자가 규칙 삭제 → **문제 지속, 가설 기각**
    - Vercel Runtime Logs 확인: `/api/seo-check` 함수 자체는 실행 시간 795ms(10초 제한 대비 여유), 에러 로그 없음, "Response finished in 1.1s"로 정상 완료된 것처럼 보임 → 함수 자체는 문제가 없다는 반증
    - Cloudflare Security → Analytics → 이벤트 로그에서 실제 원인 확정: 실패한 모든 요청 시각에 정확히 일치하는 **"서비스: Bot Fight 모드, 수행한 작업: 관리 챌린지(Managed Challenge)"** 로그 발견
    - **근본 원인**: Bot Fight 모드는 페이지 내비게이션엔 적합하지만, `fetch()`/XHR로 호출되는 JSON API 엔드포인트에는 구조적으로 안 맞음 — 챌린지를 풀려면 브라우저가 페이지를 다시 렌더링해야 하는데 API 호출은 그 경로가 없어 그대로 실패함(Cloudflare 자체가 502 형태로 응답). 무료 플랜은 "특정 경로만 챌린지 예외 처리"하는 세분화 기능(Super Bot Fight Mode)이 없어 부분적 완화가 불가능
    - **조치**: 사용자가 Bot Fight 모드를 끔 → 재검증: curl 2연속 호출(`cached:false` → `cached:true`, `checkedAt` 동일값 확인 — SEO/GEO 체커 캐싱이 실제로도 정상 작동함을 이번에 처음 실사용 환경에서 확인) + 실제 Chrome 브라우저로 `/tools/seo-geo-checker`에서 `nexalab.app` 점검 실행해 SEO 88점(B)/GEO 100점(A) 결과 화면까지 정상 렌더링 확인
    - **향후 참고**: 이 프로젝트에서 Cloudflare 봇 방어 기능을 다시 켤 일이 생기면, Bot Fight 모드(사이트 전역 적용, 무료)는 `/api/*` JSON 엔드포인트를 함께 깨뜨리므로 절대 그대로 켜지 말 것. 유료 Super Bot Fight Mode의 경로별 예외 규칙을 쓰거나, `/api/*`는 애초에 앱 자체 rate limiting(`src/middleware.ts`)에만 맡기고 Cloudflare 봇 방어는 정적 페이지 경로에만 적용하는 식으로 설계할 것

### 2026-08-21
- **메인 페이지/AI Apps 서브앱 카드 문구·이모지 정비 + HappyICT-ON → Report 점검기(개발 중) 교체**
  - `nexalab_메인카드_지침서_1.md` 기준으로 하루바이트·베누스게코 카드 설명(짧은/긴 설명 모두, 한/영)과 아이콘 이모지(하루바이트 🌱, 해피ICT-ON 🤝)를 확정 카피로 교체 (별도 커밋으로 선행 완료)
  - 이번 세션: **HappyICT-ON을 서비스 라인업에서 제거하고 그 자리에 신규 서비스 "Report Checker(리포트 점검기)"를 "준비중" 배지로 미리 노출** — 실제 서비스는 아직 구축 중이라는 사용자 확인에 따라, 노출 방식은 두 옵션(A. 준비중 배지로 미리 노출 / B. 이번엔 카드 추가 없이 HappyICT-ON만 제거) 중 **A안**으로 진행. 카드 문구/URL/이모지/색상은 확정된 값이 없어 임시 플레이스홀더로 작성함(desc: "웹사이트 리포트 자동 점검 도구, 현재 개발 중", 이모지 🔍, 색상 `#3b82f6`) — **실제 서비스 URL과 최종 카피가 정해지면 `Hero.tsx`/`ai-apps/page.tsx`의 `url`/`reportCheckerDesc`/`reportCheckerLongDesc`를 교체하고 `comingSoon` 플래그를 제거해야 함**
  - 구현: `subApps`/`apps` 배열 항목에 `comingSoon: true`, `url: null` 필드 추가 → 카드가 `comingSoon`이면 `<Link>` 대신 `<div>`로 렌더링(클릭 불가), "바로가기" 링크 텍스트 숨김, 대신 상태 배지에 "준비중"/"Coming Soon" 표시(운영중 배지와 같은 자리, 회색 톤의 별도 스타일 `comingSoonBadge`). `Hero.tsx`는 원래 상태 배지 UI 자체가 없어 `ai-apps/page.tsx`의 `cardTitleRow`/`statusBadge` 패턴을 그대로 가져와 신규 추가
  - `ai-apps/page.tsx`의 JSON-LD(`ItemList`)에서는 `comingSoon` 항목을 `filter`로 제외 — 아직 실제 URL이 없는 서비스를 `SoftwareApplication`으로 검색엔진에 노출하지 않기 위함
  - **연쇄 수정**: `messages/ko.json`·`en.json`의 `aiApps.metaDescription`(3종 → 2종 소개로 문구 변경), `biz.idea2LongDesc`(HappyICT-ON 괄호 예시 제거), `biz.provenTag5`(HappyICT-ON 태그 삭제, `biz/page.tsx`의 `provenTags` 배열도 4개로 축소) — Report 점검기는 아직 "직접 실행·검증한 것"이 아니고 "AI × 니치 시장" 사례로 단정하기도 이르다고 판단해 이 두 곳에는 새 서비스를 추가하지 않고 기존 HappyICT-ON 언급만 제거함(사용자에게 별도 확인은 하지 않음, 문서에 판단 근거만 기록)
  - `public/llms.txt`의 `AI Apps` 섹션 설명도 갱신: HappyICT-ON 언급 제거 + 이전부터 stale하게 남아있던 하루바이트 설명("식단 기록 + 영양 코칭")을 현재 실제 서비스(외국어 습관) 기준으로 함께 수정
  - 검증: `npx tsc --noEmit`, `next lint`, `next build`(`/ko`·`/en` 양쪽 정적 생성 확인) 통과. 브라우저(Chrome 자동화, dev 서버)로 메인 페이지·AI Apps 페이지의 "준비중" 카드를 라이트/다크 모드 모두에서 확인(배지·아이콘·설명 정상 표시, 링크 비활성화 확인) — 이 과정에서 `aiApps.techStackBody`("세 서비스 모두 배포·운영까지 혼자 진행")가 아직 배포되지 않은 Report Checker와 상충하는 것을 추가로 발견해 "각 서비스는 기획부터 개발까지 혼자 진행" 식으로 함께 수정(한/영). **모바일 실제 폭(390px) 스크린샷은 이번에도 리사이즈 도구가 반영되지 않아 검증하지 못함**(과거 세션에도 동일 이슈 기록됨) — 다만 기존 카드와 동일한 grid/flex 패턴을 그대로 재사용했으므로 깨질 가능성은 낮다고 판단. 다음 세션에서 재확인 권장
  - **후속 수정 (같은 날)**: 사용자가 Venus Gecko의 실제 서비스 성격을 정정 — "개체 상태를 AI가 모니터링하는 운영 도구"가 아니라 **파충류 샵을 홍보하는 단순 쇼룸/랜딩 사이트**임을 확인. `aiApps.venusGeckoLongDesc`(한/영)에서 AI 모니터링·재고 관리 관련 서술을 전부 제거하고 "개체·사육 환경을 소개해 분양 문의로 연결하는 홍보 사이트" 설명으로 교체
    - `biz.idea2LongDesc`("파충류 샵의 재고 관리(Venus Gecko)")에도 같은 오류가 있어 사용자에게 처리 방식을 확인 — **"Venus Gecko 언급만 제거"**로 확정. 예시 없이도 문장이 성립하도록 "시장 규모는 작지만 문제가 뚜렷한 틈새 영역을 골라 AI로 풀어내는 과정을 다룹니다"로 재작성(한/영). `biz.provenTag4`("Venus Gecko" 태그)는 AI 관련 주장이 없는 단순 실적 태그라 그대로 유지
