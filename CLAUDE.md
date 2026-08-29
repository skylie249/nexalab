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

- **Next.js 15.5.23 → 16.3.1 업그레이드**
  - React는 18 유지(Next 16 피어 의존성이 `^18.2.0`도 계속 허용해 굳이 19로 올리지 않음), `next-intl`도 이미 Next 16을 지원해 별도 조치 불필요. `package.json`/`eslint-config-next` 모두 `16.3.1`로 고정
  - **`next lint` 제거 대응**: `package.json`의 `lint` 스크립트를 `eslint .`로 변경. `eslint.config.mjs`는 기존 `FlatCompat.extends("next/core-web-vitals", "next/typescript")` 방식이 `eslint-config-next@16`에서 "Converting circular structure to JSON" 에러로 깨져서, `eslint-config-next/core-web-vitals` · `eslint-config-next/typescript`(둘 다 네이티브 flat config 배열을 직접 export)를 바로 import하는 방식으로 교체
  - **`middleware.ts` → `proxy.ts` 파일 컨벤션 변경 대응**: Next 16 공식 마이그레이션 문서(`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`)를 직접 읽고 `git mv src/middleware.ts src/proxy.ts` + 내보내는 함수명 `middleware` → `proxy`로 변경(matcher 기반 `config` export는 그대로 유지 가능, `proxy`는 Node.js 런타임 고정이라 `runtime` 설정만 금지됨 — 이 프로젝트는 애초에 설정한 적 없어 해당 없음). 관리자 인증 게이트(`/admin/:path*`)와 IP 기준 rate limiting 로직은 변경 없이 그대로 이전, dev 서버로 `/admin/posts` → `/admin/login` 리다이렉트가 여전히 동작하는 것까지 브라우저로 확인
  - **Edge Runtime 폐기(deprecated) 경고 대응**: `src/app/[locale]/opengraph-image.tsx`·`src/app/[locale]/posts/[id]/opengraph-image.tsx`에 있던 `export const runtime = 'edge'`를 제거(Node.js 런타임이 기본이 되어도 `next/og`의 `ImageResponse`는 정상 동작)
  - **`eslint-plugin-react-hooks` v7의 새 규칙(`react-hooks/purity`, `react-hooks/set-state-in-effect`) 대응** — `eslint-config-next@16`이 이 버전을 함께 올리면서 기존에는 통과하던 코드 4곳이 새로 에러로 걸림. 이 프로젝트는 React Compiler(`reactCompiler` 옵션·`babel-plugin-react-compiler`)를 쓰지 않지만, 그렇다고 규칙을 일괄로 꺼버리지 않고 각각 실제 원인을 보고 판단함:
    - `ProfitCalculatorClient.tsx`: `useRef(...crypto.randomUUID() ?? Date.now())`로 세션 고정 id를 만들던 부분을 `useId()`로 교체 — 매 렌더마다 인자 표현식이 재평가되는 `useRef`보다 렌더 중 호출해도 순수한 `useId()`가 이 용도(세션당 고정 id)에 더 적합하고 규칙도 만족
    - `DashboardClient.tsx`: 렌더 본문에서 직접 `Date.now()`를 호출해 "마지막 견적서 이후 며칠 지났는지"를 계산하던 부분을, mount 시 localStorage를 읽어오는 기존 effect에 `setNow(Date.now())`를 추가해 effect 안에서만 확정하도록 변경
    - `Header.tsx`: "메뉴가 닫히면 아코디언도 닫기", "경로 이동 시 도구 드롭다운 닫기" 두 군데가 `useEffect(() => setState(...), [dep])` 패턴이었는데, React 공식 문서가 권장하는 "렌더 중 이전 값과 비교해 조정" 패턴(`if (dep !== prevDep) { setPrevDep(dep); setState(...) }`)으로 리팩터링 — effect 없이 같은 렌더에서 바로 반영되어 리렌더 한 번을 줄이는 부수 효과도 있음. 브라우저로 AI 도구 드롭다운 열기 → 다른 메뉴로 이동 시 정상적으로 닫히는 것 확인
    - `ThemeProvider.tsx`·`DashboardClient.tsx`의 localStorage 하이드레이션 effect: 이 두 곳은 SSR 중에는 `localStorage`/`matchMedia` 자체가 없어 effect 없이는 근본적으로 불가능한 정당한 패턴이라 판단해 리팩터링하지 않고, `eslint-disable(-next-line) react-hooks/set-state-in-effect`로 해당 블록만 명시적으로 예외 처리(이유를 코드 주석에 남김)
  - **Turbopack 기본 전환 대응**: `next build`가 기본으로 Turbopack을 쓰게 되면서, 그동안 webpack 번들링 문제를 피하려고 넣어둔 `serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"]` 설정이 Turbopack에서도 여전히 유효한지가 이번 업그레이드의 가장 큰 리스크였음 — `next build` 결과 경고 없이 정상 완료되는 것으로 1차 확인했으나, **실제 PDF 업로드 동작(견적서 생성기)은 Vercel 배포 환경에서 재확인 필요**(과거 이 워크어라운드를 처음 도입했을 때도 최종 검증은 항상 실제 배포 환경에서 이뤄졌음, CLAUDE.md 2026-08-13 항목 참고)
  - `next.config.mjs`에 `turbopack.root`를 프로젝트 디렉터리로 명시 — 상위 폴더(`AIProject/`)에 이 프로젝트와 무관한 `package-lock.json`이 있어 Turbopack이 워크스페이스 루트를 잘못 추론한다는 경고가 있었음
  - `tsconfig.json`(`jsx: "react-jsx"`, `.next/dev/types` 포함)과 `next-env.d.ts`는 `next build`가 실행되면서 Next.js 자체가 자동으로 갱신한 것 — Next 16의 "dev/build 동시 실행" 기능(`.next/dev` 별도 출력 디렉터리)에 따른 공식 변경이라 그대로 둠
  - **참고**: Next 16부터 `next dev` 실행 시 `CLAUDE.md`(또는 `AGENTS.md`) 파일 끝에 이 프로젝트 버전에 맞는 문서를 `node_modules/next/dist/docs/`에서 참고하라는 `<!-- BEGIN:nextjs-agent-rules -->` 블록을 자동으로 추가/유지함(Next 공식 문서가 "커밋해서 트리를 깨끗하게 유지하라"고 안내) — 이 세션에서도 실제로 그 문서를 읽고 `middleware`→`proxy` 마이그레이션 세부사항(파일명, export 이름, `runtime` 설정 금지)을 확인하는 데 사용함
  - 검증: `npx tsc --noEmit`, `npm run lint`(신규 `eslint .`), `next build`(Turbopack, 경고 0개, 정적 페이지 수 기존과 동일) 모두 통과. dev 서버(포트 3001, 3000은 이전 세션 잔여 프로세스가 점유 중이었음)로 홈(`/ko`) 렌더링, `/admin/posts` → `/admin/login` 리다이렉트, 헤더의 "AI 도구" 드롭다운 열기/닫기(페이지 이동 시 자동 닫힘 포함) 정상 동작을 브라우저로 확인. **PDF 업로드·이메일 로그인 등 외부 서비스(Gemini/Supabase) 연동이 필요한 기능은 이번 세션에서 실제로 실행해보지 못함 — 다음 배포 후 재확인 권장**

- **`nexalab_report_checker_지침서.md` 기준 "보고서·기획서 다듬기" 도구 통합** (`/tools/report-checker`) — `D:\99.ETC\old_projects\AIProject\reportChecker\`에 별도 Next.js 프로젝트(report.nexalab.app 서브도메인 배포 전제)로 이미 완성돼 있던 것을 nexalab.app 경로로 포팅
  - **통합 방식**: 지침서 2-3번이 명시한 "서브도메인 대신 경로 통합" 원칙대로 코드만 이식. report.nexalab.app 서브도메인 리다이렉트/폐기는 Vercel·DNS 설정이 필요해 사용자 확인 후 범위에서 제외(사용자가 직접 처리)
  - **기존 "Report Checker(리포트 점검기)" 준비중 카드 처리**: 2026-08-21 앞선 세션에서 메인/AI Apps 페이지에 추가해둔 동명의 "준비중" 서브앱 카드(설명: "웹사이트 리포트 자동 점검 도구")가 이 기능을 가리키던 placeholder였음을 사용자에게 확인받음. 다만 지침서의 경로 통합 아키텍처(서브도메인이 아닌 `/tools/` 유틸리티)에 맞춰 `Hero.tsx`/`ai-apps/page.tsx`의 Live Sub-Apps 카드 그리드에서는 완전히 제거하고, 대신 견적서 생성기·손익 계산기 등 다른 `/tools/` 도구들과 동일하게 `Header.tsx`의 "AI 도구" 드롭다운에 `navReportChecker`/`aiToolsReportDesc`(NEW 배지)로 편입 — Live Sub-Apps는 별도 배포되는 독립 서비스(Harubite, Venus Gecko)만 남도록 정리. 두 파일 모두 이제 `comingSoon` 케이스가 전혀 없어져 관련 조건부 렌더링(`comingSoonBadge`, `cardDisabled`, JsonLd `filter`)도 함께 제거(타입 추론상 남겨두면 `app.comingSoon` 접근이 컴파일 에러가 됨)
  - **lib 포팅**: `src/lib/reportChecker{Types,Config,RuleChecks,AiChecks,Scoring,Gemini,Rewrite}.ts` 7개 신규 파일로 원본 로직을 그대로 이식(문장 길이·접속사 남용·이중피동/만연체·문단 길이·옛 관용구·핵심어 반복·소제목 구조 규칙 체크 8종 + Gemini 채점 기준표 기반 AI 체크 7종 + AI 전체 리라이팅). 원본은 API 라우트마다 각자 Gemini fetch 로직을 갖고 있었으나, nexalab에는 아직 공용 Gemini 헬퍼가 없어(`/api/quote`가 자체 inline 구현) 이번에 `reportCheckerGemini.ts`로 분리해 AI 체크·리라이팅 두 곳에서 재사용(견적서 생성기 쪽 리팩터링은 범위 밖이라 손대지 않음)
  - **카테고리 라벨·면책 문구는 한국어 고정**: 분석 대상(한국 기업 보고서)과 채점 기준표 자체가 한국어 전용이라, `seoGeoConfig.ts`의 `SCORE_DISCLAIMER_KO` 선례와 동일하게 `reportCheckerConfig.ts`의 카테고리 라벨·면책 문구는 로케일 번역 없이 한국어로 고정. 도구 페이지의 정적 UI 문구(버튼·안내문구·에러 메시지 등)만 사용자 확인대로 `messages/ko.json`·`en.json`의 신규 `reportChecker` 네임스페이스로 한/영 이중언어 지원 — 영문 페이지에는 "이 도구는 한국어 텍스트만 분석합니다"를 subtitle/formNote에 명시해 한국어 전용 분석 결과가 나오는 이유를 안내
  - **API 라우트**: `/api/report-check`(규칙 체크 + AI 체크 병합 후 점수 산출), `/api/report-rewrite`(AI 전체 리라이팅) 신규 추가. `src/proxy.ts`의 `RATE_LIMITS`에 각각 IP당 24시간 10회/5회로 등록(원본과 동일한 한도, 이미 있는 `GEMINI_API_KEY` 재사용이라 별도 키 발급 불필요). 지침서 6번 리스크 관리 원칙대로 요청서 원문·분석 결과 모두 서버에 저장하지 않음(기존 도구들의 무저장 원칙과 동일)
  - `public/llms.txt`: report-checker를 Free Tools 목록에 추가하면서, 이전부터 누락돼 있던 SEO/GEO 체커·llms.txt 생성기 항목도 함께 보완(4개 도구 전부 최신화). 겸사겸사 지난 세션에 정정됐던 "Venus Gecko는 AI 모니터링 도구가 아니라 홍보용 쇼룸 사이트"라는 내용이 이 파일에는 반영되지 않고 있던 것을 발견해 함께 수정
  - **검증**: `npx tsc --noEmit`, `npm run lint`, `next build`(`/ko`·`/en` 양쪽 `/tools/report-checker` 정적 생성 + 신규 API 라우트 2개 Dynamic 확인) 모두 통과. 브라우저(Chrome 자동화, dev 서버, 로컬 `GEMINI_API_KEY`로 실제 Gemini 호출 포함) end-to-end 검증: 만연체·수동태·옛 관용구·두괄식 미흡 등 의도적으로 문제를 심은 샘플 텍스트로 진단 실행 → 카테고리별 점수(두괄식 25/F, 문장구조 38/F, 톤앤매너 75/B 등)와 규칙/AI 체크 항목·수정 힌트가 올바르게 표시됨을 확인 → "AI 전체 리라이팅 제안 보기" 클릭 → 주요 변경사항·원문/제안 비교 컬럼까지 정상 생성 확인. `/en` 페이지, 헤더 드롭다운의 "보고서 다듬기" 링크, 메인/AI Apps 페이지에서 카드가 정상적으로 2개(Harubite·Venus Gecko)만 남은 것도 확인
  - **부수적으로 발견한 이슈(수정 완료)**: 이번 세션 중 `next dev`를 실행했을 때, `CLAUDE.md` 자동 재작성 로직(`generate-agent-files.js`)이 과거 로그에 텍스트로 언급된 `` `<!-- BEGIN:nextjs-agent-rules -->` `` 문자열(백틱 안에 든 설명용 인용)을 실제 마커로 오인해, 그 지점부터 파일 내용 일부("검증:" 항목 한 줄과 앞 문장 뒷부분)가 유실된 채 블록이 재생성되는 것을 발견함. 원본 텍스트를 git diff로 복구해 CLAUDE.md를 원상태로 되돌림 — **향후 CLAUDE.md 안에서 이 마커 문자열을 다시 인용할 일이 있다면 백틱 인용이라도 잘림 사고가 재현될 수 있으니 유의, 또는 그런 언급 자체를 피할 것**
  - **이번 범위에서 하지 않은 것**: 대시보드(`/dashboard`) 연동(다른 3개 도구처럼 `dashboardHistory.ts`에 결과 저장) — 지침서·사용자 요청 어디에도 없어 범위 외로 판단, 필요 시 추후 별도 작업. `industryPresets`류의 v2 확장(업종별 보고서 템플릿)도 지침서 로드맵 3~4단계 이후 항목이라 보류
  - **후속 조치 (사용자 완료)**: 사용자가 기존 `report.nexalab.app` 서브도메인 관련 인프라(Cloudflare DNS, Vercel 프로젝트, GitHub 저장소, 로컬 `D:\99.ETC\old_projects\AIProject\reportChecker\` 폴더)를 모두 정리·삭제함. 이제 이 기능은 nexalab.app 코드베이스의 `/tools/report-checker` 경로가 유일한 구현체 — 코드베이스 내 `report.nexalab.app` 도메인 참조는 원래 없었음을 확인(grep으로 재확인, `reportChecker*`라는 내부 파일/변수 네이밍만 남아있고 실제 도메인 문자열은 없음)

- **`nexalab_웹접근성_점검기_지침서.md` 기준 웹접근성(A11y) 점검 MVP 구현** — 지침서 5번이 명시한 대로 새 도구/새 API를 만들지 않고, 기존 SEO/GEO 체커(`/tools/seo-geo-checker`, `/api/seo-check`)의 같은 파싱 파이프라인·같은 리포트에 세 번째 축으로 얹는 방식으로 구현
  - **범위**: 지침서 3-1 표에서 "하" 난이도로 분류된 8개 항목만 구현(1단계 MVP) — 대체 텍스트, html lang·title 존재 여부, 헤딩 계층, 폼 라벨, 링크 텍스트, 멀티미디어 자막, 확대(pinch zoom) 차단 여부, 자동 재생·애니메이션(marquee/blink 포함). "중" 난이도인 색상 대비·키보드 접근성·포커스 표시·ARIA 오사용은 지침서 로드맵대로 v1.1/v1.2로 보류
  - `src/lib/seoGeoTypes.ts`: `CheckGroup`에 `"a11y"` 추가, `AnalysisReport`에 `a11y: ScoreResult` 필드 추가
  - `src/lib/seoGeoConfig.ts`: a11y 전용 서브카테고리 8개(`a11y_alt_text` 등)와 라벨을 `SUBCATEGORY_ORDER`/`CATEGORY_LABELS`에 추가, `A11Y_MISSING_WARN_RATIO`(누락 비율 30% 기준 warn/fail 분기, 기존 SEO의 alt 텍스트 임계값과 동일), `A11Y_GENERIC_LINK_TEXTS`(맥락 없는 링크 텍스트 사전), `A11Y_SCORE_DISCLAIMER_KO`(지침서 5번 "정적 분석 한계 명시" 문구) 추가
  - `src/lib/seoGeoAnalyzer.ts`: 8개 체크 함수 신규 추가(`checkAltTextA11y`, `checkHtmlLangA11y`, `checkPageTitleA11y`, `checkHeadingA11y`, `checkFormLabelsA11y`, `checkLinkTextA11y`, `checkMultimediaA11y`, `checkResponsiveZoomA11y`, `checkAutoplayA11y`). 헤딩 계층 스킵 판정 로직은 기존 SEO 체크(`checkHeadingHierarchy`)와 완전히 동일해서 `getHeadingLevels`/`hasHeadingSkip` 헬퍼로 추출해 재사용(중복 제거). `analyze()`가 이 8개를 호출해 `checks` 배열에 합치고 `computeScore(checks, "a11y")`로 점수 산출 — 기존 SEO/GEO와 동일한 단순 pass=1/warn=0.5/fail=0 가중치 공식 그대로 사용(지침서의 카테고리별 20%/15% 가중치 표는 색상 대비·키보드·ARIA 카테고리가 아직 없는 상태에서 그대로 적용하면 왜곡되므로, 해당 카테고리들이 실제로 구현되는 v1.1/v1.2 시점에 도입하기로 보류)
  - **API 라우트 변경 없음**: `/api/seo-check`(`route.ts`)는 그대로 `analyze()`만 호출하므로 코드 수정 없이 응답에 `a11y` 필드가 자동으로 포함됨. 24시간 캐싱·IP 레이트리밋도 기존 그대로 재사용(지침서 5번이 명시한 재사용 원칙과 일치). 다만 캐시 TTL(24시간) 내에 이번 배포 이전에 저장된 캐시 항목은 `report_json`에 `a11y` 필드가 없을 수 있어, 클라이언트에서 `result?.report.a11y`를 옵셔널로 다뤄 방어함(스키마 마이그레이션 없이 자연스럽게 24시간 후 소멸)
  - **UI (`SeoGeoCheckerClient.tsx`)**: 지침서 4번 UX가 제안한 "3개 탭" 대신, 기존에 이미 구현되어 있던 "서브카테고리별 섹션 나열" 패턴(탭이 아니라 하나의 스크롤 리포트, SEO/GEO도 원래 탭으로 분리돼 있지 않았음)을 그대로 확장하는 쪽을 택함 — 새 탭 UI를 만드는 것보다 기존 패턴과 일관되고 구현 비용이 훨씬 낮으면서, "한 리포트 안에 SEO/GEO/접근성이 모두 보인다"는 지침서의 핵심 목표는 동일하게 달성됨
    - 점수 카드 3개(SEO/GEO/접근성)로 확장, 지침서 3-3 "치명도(Critical/Warning/Info) 태깅" 요구는 기존 `CheckStatus`(pass/warn/fail)를 그대로 활용(fail=Critical, warn=Warning)해 별도 필드 추가 없이 충족
    - 지침서 4번 "Critical 항목은 붉은 배지 + 최상단 고정" 요구를 위해 `group==="a11y" && status==="fail"`인 체크만 모아 점수 카드 바로 아래 `criticalSection`(붉은 테두리)으로 별도 고정 노출 — 아래 서브카테고리별 섹션에도 동일 항목이 다시 나타나므로 중복 표시지만, "위에서 바로 보이는 요약" 역할을 하도록 의도적으로 유지
    - 지침서 3-2 수동 체크리스트 4개 항목을 `ManualChecklist` 컴포넌트(체크박스, 로컬 state만 사용·저장 없음)로 결과 화면 하단에 추가 — 프로젝트의 기존 무저장 원칙과 일치시키기 위해 localStorage에도 남기지 않음(단순 UI 상호작용용)
    - a11y 전용 면책 문구(`A11Y_SCORE_DISCLAIMER_KO`)를 기존 SEO/GEO 문구 아래에 추가 노출
  - **i18n**: `messages/ko.json`/`en.json`의 `seoGeoChecker` 네임스페이스에 `a11yScoreLabel`/`a11yCriticalTitle`/`a11yManualChecklistTitle`/`a11yManualItem1~4` 등 추가. 도구의 3종 통합 포지셔닝을 반영해 `metaTitle`/`metaDescription`/`title`/`subtitle`도 "SEO·GEO·접근성" 문구로 갱신. `Header.tsx`가 참조하는 `aiToolsSeoDesc`도 동일하게 갱신(코드 변경 없이 메시지 파일만 수정 — `Header.tsx`는 이미 이 키를 그대로 노출하는 구조였음). 개별 체크 결과의 title/detail/fixHint는 기존 SEO/GEO 체크와 동일하게 한국어로 고정(이 파일 전체가 이미 그 패턴 — 페이지 UI 문구만 로케일별 번역, 체크 결과 문구는 비번역)
  - `public/llms.txt`의 SEO/GEO 체커 설명에 접근성 점검 내용 추가
  - **검증 (1차, 코드 레벨)**: `npx tsc --noEmit`, `npm run lint`(진행 도중 `node_modules`가 `package.json`의 `eslint-config-next@16.3.1`과 어긋나 있던 것을 발견해 `npm install`로 동기화 — 이번 세션 변경과 무관한 기존 상태였음), `next build`(`/ko`·`/en` 양쪽 `/tools/seo-geo-checker` 정적 생성 확인) 모두 통과. 8개 체크 로직 자체는 `seoGeoConfig.ts`/`seoGeoAnalyzer.ts`/`seoGeoTypes.ts`만 `tsc`로 별도 컴파일해 스크래치 스크립트로 검증 — 의도적으로 문제를 심은 샘플 HTML(alt 없는 이미지, lang 없음, title 없음, H1 없음, 라벨 없는 input, "여기를 클릭" 링크, 자막 없는 video, `user-scalable=no`, `<marquee>`)에서 8개 전부 fail/warn으로 정확히 잡히고 F등급(6점)이 나오는 것, 반대로 문제를 모두 고친 샘플에서는 9개 체크 전부 pass·A등급(100점)이 나오는 것을 확인함
  - **후속 세션 — 브라우저 실사용 검증 완료**: 최초 구현 세션에서는 Chrome 자동화 도구가 로컬 dev 서버·외부 사이트 모두에 접속 실패(`Frame with ID 0 is showing error page`)해 실제 화면 검증을 못 했었음. 원인 조사 결과, 연결된 Chrome이 이 프로젝트가 실행되는 Windows 머신과 물리적으로 다른 네트워크에 있어(`localhost`/LAN IP 모두 `ERR_CONNECTION_TIMED_OUT`, 인터넷 사이트는 정상) 발생한 문제로 확인 — `next dev -H 0.0.0.0`으로 IPv4 바인딩을 바꿔봐도 해결되지 않아, 결국 `cloudflared`(Cloudflare Quick Tunnel)로 로컬 서버를 임시 공개 URL로 노출해 우회함(사용자에게 관리자 라우트 노출 가능성을 고지하고 확인받은 뒤 진행)
    - 터널 연결 후에도 "타이핑은 되는데 제출 버튼 클릭 시 폼이 native GET으로 제출되며 리액트 상태가 초기화되는" 현상이 간헐적으로 발생 — `next dev`의 Turbopack HMR이 세션 중 발생한 무관한 파일 변경(다른 검증용 `tsc` 컴파일, `npm install` 등)을 감지해 예측 불가능한 시점에 클라이언트를 통째로 풀 리로드시키는 것으로 원인을 좁힘(리액트 이벤트 핸들러 자체는 정상이었고, 재현이 클릭 직후가 아니라 수 초 뒤 비동기적으로 발생한 점에서 확인). `next build && next start`(프로덕션 모드, HMR 없음)로 전환하자 문제가 완전히 사라짐
    - 프로덕션 서버 + 터널로 실제 URL(`https://www.nexalab.app`) 점검을 엔드투엔드로 실행해 확인: 점수 카드 3개(SEO 100/A, GEO 100/A, 접근성 100/A) 정상 렌더링, 통과/개선필요/실패 배지에 접근성 카운트 합산 정상, 8개 접근성 카테고리 섹션 전부(대체 텍스트/문서 구조/헤딩 계층/폼 라벨/링크 텍스트/멀티미디어 자막/반응형·확대/자동 재생) 정상 표시, 수동 체크리스트 4개 항목의 체크박스 클릭 시 취소선 스타일 적용까지 확인. 라이트/다크 모드 전환 후에도 스코어카드·배지·카테고리 섹션 레이아웃이 깨지지 않음을 확인. `nexalab.app` 자체는 8개 항목 모두 통과해 Critical 배지 섹션(치명적 문제 있을 때만 노출)은 이번 검증에서 실제로는 나타나지 않았음 — 로직은 별도로 작성한 문제 있는 샘플 HTML로 이미 검증됨(위 1차 검증 항목 참고)
    - 검증에 사용한 `cloudflared` 임시 터널과 프로덕션 서버(포트 3010)는 확인 후 모두 종료·정리함(공개 URL 재사용 불가 상태로 원복)
    - **참고**: Next.js의 CLAUDE.md 자동 재작성 로직이 이번 세션의 `next build`/`next start` 실행 중에도 발동해 파일 뒷부분이 유실되는 것을 다시 확인함(과거엔 `next dev`에서만 확인됐던 것과 달리 build/start에서도 재현) — `git checkout`으로 복구. 자동 재작성이 찾는 마커 문자열을 이 문서 안에 다시 그대로 인용하면 잘림이 재발할 수 있어, 이 문단에서는 마커 이름 언급 자체를 피함

### 2026-08-22
- **`nexalab_웹접근성_점검기_지침서.md` v1.1 — 색상 대비(1.4.3) 계산 추가**: 위 MVP(하 난이도 8개)에 이어 지침서 5번 로드맵의 "중" 난이도 항목인 색상 대비를 추가. 실제 브라우저(`getComputedStyle`)가 없는 서버리스 환경이라 "완전한 계산"은 불가능하다는 전제를 명확히 하고, 최대한 근사치를 내되 확신이 없으면 pass/fail 대신 "정보 부족"으로 물러나는 방향으로 설계함
  - `src/lib/colorContrast.ts`(신규, DOM 의존성 없는 순수 함수): hex/rgb()/rgba()/hsl()/hsla()(콤마 문법과 `rgb(0 0 0 / 50%)` 신문법 모두)와 CSS Color Module Level 3 표준 이름 있는 색상 147개를 파싱하는 `parseColor()`, 반투명 전경색을 배경 위에 합성하는 `compositeOverBackground()`, WCAG 상대 휘도·대비율 공식(`contrastRatio()`), 큰 텍스트(24px 이상, 또는 굵게 18.66px 이상) 여부에 따라 3:1/4.5:1 기준을 고르는 `requiredContrastRatio()`
  - `src/lib/cssStaticParser.ts`(신규, DOM 의존성 없는 순수 함수): 콤비네이터(자손/가상클래스/속성선택자)가 없는 "단순 선택자"(`div`, `.foo`, `#bar`, `div.foo.bar` 조합)만 매칭 대상으로 삼는 극단순 CSS 파서. `@media` 등 at-rule 내부는 조건부 스타일(다크모드 등)이라 기본 렌더링 상태를 알 수 없으므로 통째로 스킵(오탐 방지를 위한 의도적 단순화), `:root{}`의 `--변수`만 별도로 모아 `var(--name, fallback)`을 재귀 치환하는 `resolveVar()` 제공
  - `src/lib/seoGeoAnalyzer.ts`: `AnalysisInput`에 `externalCss?: string[]` 추가, HTML의 `<link rel="stylesheet">`를 절대 URL로 뽑아내는 `extractStylesheetUrls()`를 새로 export(라우트가 이 URL들을 fetch해서 넘겨주는 구조 — analyze() 자체는 네트워크 호출을 하지 않는 기존 원칙 유지). 신규 `checkColorContrastA11y($, externalCss)`: `<style>` 블록 + 전달받은 외부 CSS를 합쳐 규칙 인덱스(id/class/tag별 Map, 조회 성능을 위해 전체 스캔 대신 후보만 좁힘)를 만들고, `<body>` 내 "자기 텍스트를 직접 가진" 요소를 최대 500개(지침서 5번 "주요 영역만 샘플링" 유의사항)까지 순회하며 color는 상속(조상 체인을 걸어 올라가며 탐색), background-color는 비상속(가장 가까운 불투명 배경까지 조상을 걸어 올라감, 못 찾으면 브라우저 기본값 흰색)이라는 CSS 규칙을 반영해 유효 색상을 추정. **color와 background 둘 다 CSS에서 전혀 확인되지 않은 요소는 표본에서 제외**(기본값끼리 비교하면 항상 통과로 나와 검사 자체가 무의미해지므로) — 이 결과 확인 가능한 표본이 5개 미만이면 pass/fail이 아니라 "정보 부족" warn으로 처리
  - `src/app/api/seo-check/route.ts`: HTML 응답을 받은 직후 `extractStylesheetUrls()`로 최대 3개의 외부 스타일시트 URL을 뽑아, 기존 robots.txt/llms.txt/sitemap.xml과 같은 `Promise.all` 배치에 추가해 함께 fetch(각각 3초 타임아웃·400KB 상한, 동일하게 best-effort — 실패해도 전체 요청은 계속 진행되고 색상 대비 체크가 "정보 부족"으로 알아서 처리)
  - `src/lib/seoGeoConfig.ts`: `CheckSubcategory`에 `a11y_color_contrast` 추가, `SUBCATEGORY_ORDER`에서 대체 텍스트 다음 순서로 배치(지침서 3-1 표 순서 기준), `CATEGORY_LABELS`에 "색상 대비" 라벨 추가. UI(`SeoGeoCheckerClient.tsx`)는 기존에 이미 subcategory를 순회하며 제네릭하게 렌더링하는 구조라 **코드 변경 없이** 새 체크가 자동으로 리포트에 편입됨(Critical 섹션도 `group==="a11y" && status==="fail"` 조건이 그대로 적용됨)
  - **버그를 실사용 사이트 검증 중 발견·수정**: 합성 테스트 HTML로는 문제가 없었으나, 실제 `nexalab.app`(Next.js 프로덕션 빌드가 CSS 상단에 `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");`를 삽입)을 대상으로 스크립트 검증을 하자 헤더의 "NEW" 배지(흰 글씨 on `var(--accent-color)` 배경)가 대비 1.0:1(사실상 동일 색상)로 완전히 잘못 계산됨을 발견. 원인은 `parseCss()`가 중괄호(`{`) 등장 위치만으로 규칙 헤더를 스캔하는데, `@import ...;`처럼 중괄호 없이 세미콜론으로 끝나는 at-rule을 처리하지 않아 바로 다음 규칙(`:root{...}`)의 헤더 텍스트에 통째로 흡수되어 `:root` 변수 추출 자체가 조용히 실패(`--accent-color`가 미해석 상태로 남아 `parseColor`가 null 반환 → 배경색이 조상 체인을 타고 올라가 엉뚱한 값과 일치)하던 것. `@import`/`@charset` 문을 파싱 전에 먼저 제거하도록 수정했는데, 1차 수정(`[^;]*;`)은 Google Fonts URL 자체에 포함된 세미콜론(`Inter:wght@400;500;...`) 때문에 또 실패해, 따옴표 안은 통째로 건너뛰는 정규식(`(?:"[^"]*"|'[^']*'|[^;])*;`)으로 재수정 — 수정 후 재검증하니 실제 대비가 3.7:1(기준 4.5:1 미달)로 정확히 계산됨을 확인
  - **검증**: `npx tsc --noEmit`, `npm run lint`, `next build`(Turbopack, `/ko`·`/en` 양쪽 `/tools/seo-geo-checker` 정적 생성 확인) 모두 통과. `tsx`로 스크래치 스크립트 실행해 (1) CSS 변수로 정의된 저대비/고대비/큰텍스트 저대비가 섞인 합성 HTML → 6곳 중 3곳 fail로 정확히 검출, (2) CSS가 전혀 없는 페이지 → "정보 부족" warn(pass/fail로 오판하지 않음), (3) 전부 고대비인 페이지 → 전체 pass, (4) `externalCss` 인자로 전달되는 외부 스타일시트 경로도 동일하게 동작 — 4가지 시나리오 모두 기대대로 나옴을 확인. 추가로 실제 프로덕션 `https://www.nexalab.app/ko`를 대상으로 route.ts와 동일한 방식(HTML fetch → `extractStylesheetUrls()` → 외부 CSS 3개 fetch → `analyze()`)을 재현하는 스크립트를 실행해 실사용 사이트 기준 접근성 점수 95/A(pass 9, warn 1, fail 0)와 위에서 발견한 실제 대비 이슈까지 최종 확인. 브라우저 UI 렌더링(카테고리 섹션 순서, 라벨 표시)은 기존 MVP 세션에서 이미 같은 렌더링 경로(제네릭 subcategory 순회)로 검증된 패턴이라 별도 브라우저 재검증은 생략함 — **다음 세션에서 실제 브라우저로 "색상 대비" 섹션이 정상 노출되는지 최종 확인 권장**
  - **⚠️ 이번 작업과 무관하게 발견해 조치한 보안 이슈**: 작업 중 `git status`에서 `.env.example`(저장소에 커밋되는 템플릿 파일)이 로컬에서 수정되어 있는 것을 발견 — `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`GEMINI_API_KEY` 자리에 플레이스홀더 대신 **실제 값(서비스 역할 키 포함)**이 채워진 상태로 uncommitted 상태였음. `git log -p`로 확인한 결과 지금까지 커밋된 이력에는 항상 플레이스홀더만 있어 원격에 유출된 적은 없었음. 사용자에게 확인 후 `git checkout -- .env.example`로 플레이스홀더 상태로 원상복구함(실제 키는 `.env.local`에 그대로 남아있어 로컬 개발에는 영향 없음)

- **`nexalab_웹접근성_점검기_지침서.md` v1.2 — 키보드 접근성(정적)·포커스 표시·ARIA 오사용 추가**: 위 v1.1(색상 대비)에 이어 지침서 5번 로드맵의 나머지 "중" 난이도 항목 3개를 마저 구현. 세 항목 모두 실제 브라우저 렌더링/JS 실행 없이는 완전히 판별할 수 없는 항목이라, spec 3-1 표가 명시한 "정적 분석" 범위로 스코프를 명확히 좁히고 한계를 detail 문구에 그대로 노출하는 방향으로 설계함(v1.1의 "정보 부족" warn 패턴과 같은 원칙)
  - `src/lib/cssStaticParser.ts`: 기존 `parseCss()`의 중괄호 깊이 스캔 로직을 `scanCssBlocks()`(헤더+본문 블록만 뽑는 범용 함수)로 분리하고 `parseCss()`는 이를 소비하도록 리팩터링(동작 변화 없음). 포커스 체크 전용으로 `findFocusRuleDeclarations()` 신규 추가 — `parseCss()`는 "콤비네이터/의사클래스 있으면 매칭 안 함" 제약이 있어 `:focus` 선택자를 원천적으로 버리므로, 별도로 헤더 텍스트에 `:focus`/`:focus-visible`/`:focus-within`이 포함된 블록만(DOM 매칭이 필요 없어 콤비네이터가 있어도 무방) 선언 전체를 그대로 반환하는 경로를 새로 만듦
  - `src/lib/seoGeoConfig.ts`: `CheckSubcategory`에 `a11y_keyboard`/`a11y_focus`/`a11y_aria` 추가(지침서 3-1 표 순서대로 폼 라벨 다음, 링크 텍스트 이전에 배치). WAI-ARIA 1.2 role 목록(추상 역할 제외 약 80개)과 표준 `aria-*` 속성 전체 목록, true/false(+mixed)만 허용되는 boolean/tristate 속성 목록, 브라우저가 기본으로 키보드 조작을 지원하는 태그 목록을 순수 데이터 상수로 추가(`ARIA_VALID_ROLES`/`ARIA_VALID_ATTRIBUTES`/`ARIA_BOOLEAN_ATTRIBUTES`/`ARIA_TRISTATE_ATTRIBUTES`/`A11Y_NATIVE_INTERACTIVE_TAGS`)
  - `src/lib/seoGeoAnalyzer.ts`:
    - `checkKeyboardAccessA11y($)`: `[onclick]` 요소 중 네이티브 인터랙티브 태그(a/button/input 등)가 아니면서 `onkeydown`/`onkeypress`/`onkeyup`이 없는 요소를 탐지. **가장 큰 한계**: 정적 HTML의 `onclick=` 속성만 볼 수 있어, React 등 프레임워크가 JS로 붙이는 이벤트 핸들러(JSX `onClick` 등)는 렌더링된 HTML에 흔적이 없어 원천적으로 검사 대상에서 빠짐 — 이 한계를 pass/fail 모든 경우 detail에 항상 명시해 "onclick이 하나도 안 잡혔다 = 문제 없다"로 오인하지 않게 함
    - `checkFocusOutlineA11y($, externalCss)`: `findFocusRuleDeclarations()`로 뽑은 `:focus` 규칙 중 `outline`이 `none`/`0`/`0px`이면서 `box-shadow`/`border`/`background` 등 같은 규칙 안에 대체 시각 표시가 전혀 없는 경우만 문제로 판정(다른 규칙에 나눠 정의된 대체 스타일은 정적 분석으로 연결할 수 없어 놓칠 수 있음 — 과탐 대신 과소탐 쪽으로 의도적으로 치우침). `:focus` 규칙 자체가 하나도 안 잡히면(외부 CSS fetch 실패, CSS-in-JS 등) v1.1의 색상 대비와 동일하게 pass/fail이 아니라 "확인 불가" warn으로 처리
    - `checkAriaMisuseA11y($)`: `role` 속성 값(공백 구분 fallback 목록 지원)과 `aria-*` 속성 이름·boolean/tristate 값을 각각 검증. `aria-*`는 스펙상 커스텀 확장이 존재하지 않아(전부 예약어) 목록에 없으면 오탐 위험 없이 오타로 확정할 수 있음(예: `aria-lable`)
    - 세 체크 모두 `checks` 배열에 `checkFormLabelsA11y` 다음, `checkLinkTextA11y` 이전 순서로 추가(SUBCATEGORY_ORDER와 일치)
  - UI(`SeoGeoCheckerClient.tsx`)는 v1.1과 마찬가지로 subcategory 제네릭 순회 구조라 **코드 변경 없이** 새 섹션 3개가 자동으로 리포트에 편입됨
  - **검증**: `npx tsc --noEmit`, `npm run lint`, `next build`(Turbopack) 모두 통과. `tsx` 스크래치 스크립트로 8개 시나리오 확인 — 키보드(onclick만 있는 div → fail, onkeydown 추가 시 → pass, onclick 자체 없음 → pass), 포커스(outline만 제거 → fail, box-shadow 대체 존재 → pass, `:focus` 규칙 자체 없음 → "확인 불가" warn), ARIA(잘못된 role·오타 속성·잘못된 boolean 값 3종 동시 → fail 및 각 원인이 예시에 정확히 표시, role/aria-* 전무 → pass) 모두 기대대로 동작. 이어서 실제 프로덕션 `https://www.nexalab.app/ko`와 `/ko/tools/seo-geo-checker`를 대상으로 v1.1과 같은 방식(HTML+외부 CSS 3개 fetch 후 `analyze()`)으로 재검증 — 키보드/ARIA는 두 페이지 모두 pass(React 앱이라 정적 onclick이 없고 이번 세션에서 심은 유효하지 않은 aria 속성도 없었음), 포커스는 홈은 "확인 불가" warn(fetch된 CSS 청크에 `:focus` 규칙이 안 걸림)·도구 페이지는 실제 `:focus` 규칙 1건을 찾아 pass로 정확히 갈리는 것을 확인해 오탐 없음을 검증함
  - **범위에서 하지 않은 것**: 지침서 5번 로드맵은 v1.2까지가 명시된 범위 전부 — 이후 단계(4단계 "리드젠·수익화 연결")는 이번 접근성 기능과 무관한 별도 트랙(통합 PDF 리포트 이메일 게이트 등)이라 착수하지 않음

- **웹접근성 점검기(v1.1/v1.2)로 nexalab.app 자기 자신을 실제 점검·조치**: "점검기를 만들었으니 실제로 우리 사이트에 돌려서 문제를 고쳐달라"는 요청에 따라, 배포된 사이트가 아니라 로컬 프로덕션 빌드(`next build && next start`)를 대상으로 우리 체커(`analyze()`)를 직접 실행해 점검 → 원인 추적 → 코드 수정 → 재검증을 반복
  - **1차 발견 — `--accent-color` 토큰 자체가 구조적으로 대비 기준 미달**: 라이트 `#3b82f6`/다크 `#60a5fa` 둘 다, ①흰 텍스트를 얹는 배지·버튼 배경(예: 헤더 "NEW" 배지)과 ②페이지 배경 위에 얹는 강조 텍스트(카테고리 라벨 등) 두 역할을 동시에 하고 있었는데, 계산해보니 다크 테마에서는 이 두 역할이 **동시에 만족 불가능한 상충 관계**(흰 텍스트용은 어두워야 하고, 어두운 배경 위 텍스트용은 밝아야 함)임을 확인 — 토큰 하나로는 근본적으로 못 고치는 구조적 문제였음
    - 해결: `globals.css`에 역할별 토큰 분리 — `--accent-color`(배지/버튼 채움, 라이트·다크 동일하게 blue-600 `#2563eb`으로 진하게 통일 — 흰 텍스트 대비 4.5:1 이상 확보) / `--accent-text`(배경 위 강조 텍스트 전용, 라이트는 accent-color와 동일값, 다크는 기존 accent-color 값(`#60a5fa`, 이미 어두운 배경에서 충분히 밝았음)을 그대로 재사용) / `--accent-hover`(라이트는 새 accent-color와 구분되도록 blue-700 `#1d4ed8`로 한 단계 더 진하게, 다크는 기존 값 유지)
    - `color: var(--accent-color);`로 되어있던 순수 텍스트 용도(배경/보더는 제외) 52곳을 전 컴포넌트·페이지에 걸쳐 `color: var(--accent-text);`로 일괄 치환(정규식으로 "정확히 이 한 줄"만 매칭해 `background-color`/`border-color`는 건드리지 않음, 사전에 접두사 없이 매칭되는 줄이 없는지 확인 후 실행)
    - `ToolPromoBanner`(견적서/손익계산기 홍보 배너)와 `Hero`/`ai-apps`(Harubite·Venus Gecko 카드)의 CTA 텍스트는 컴포넌트별 하드코딩 hex(`#3b82f6`/`#8b5cf6`/`#f59e0b`/`#10b981`)를 인라인 `style`로 직접 쓰고 있어 위 일괄 치환 대상이 아니었음 — 각각 라이트용으로 어둡게 조정한 새 토큰(`--tool-purple-text`, `--harubite-text`, `--venusgecko-text`)을 globals.css에 추가하고, 컴포넌트에 `textColor` 필드를 분리해 아이콘 배경 틴트(`${color}20`, 이건 대비 요건 대상 아님)는 원래 밝은 브랜드색 그대로, CTA 텍스트만 새 토큰을 쓰도록 수정
    - 부수 발견: `ToolPromoBanner`/`Hero`의 `.linkText`에 `opacity: 0.8`(hover 시 1로 복귀)이 걸려있어, 색상을 아무리 진하게 고쳐도 실제 렌더링 대비는 그보다 항상 낮았음(우리 체커는 CSS `opacity` 속성을 대비 계산에 반영하지 못하는 한계가 있어 이 감쇠분은 잡아내지 못함 — 코드 리뷰로 직접 발견). CTA로 클릭을 유도해야 하는 텍스트를 기본 상태에서 흐리게 두는 것 자체가 접근성·전환율 양쪽에 안 좋은 패턴이라 판단해 `opacity: 0.8`/`hover{opacity:1}` 규칙을 아예 제거(상시 완전 불투명)
    - `ai-apps` 페이지의 `.statusBadge`("운영중")는 반투명 배경(`rgba(16,185,129,0.15)`) 위에 배경과 **똑같은 색상의 텍스트**(`#10b981`)를 얹고 있어 사실상 텍스트가 배경에 파묻히는 상태였음(체커가 반투명 배경의 알파를 무시하고 완전 불투명으로 오판해 최초엔 1.0:1로 보고 — 아래 체커 버그 수정 이후 실제 값 재확인). `--venusgecko-text`로 교체. 관리자 전용 `admin/(protected)/posts` 목록의 "게시됨" 배지(`rgba(34,197,94,0.15)` 배경 + `#16a34a` 텍스트, 수동 계산 시 2.89:1 미달)도 같은 패턴이라 로그인 뒤에서만 보이는 화면이지만 함께 고침(재사용 가능한 토큰이라 `--venusgecko-text`로 동일 교체)
  - **2차 발견 — 헤딩 계층 스킵(h1→h3, WCAG 1.3.1)**: `ai-apps`/`biz` 페이지 둘 다 `<h1>`(페이지 제목) 바로 다음 카드 제목에 `<h2>`를 건너뛰고 `<h3>`을 쓰고 있었음(그 아래 "기술 스택"/"안내" 섹션은 `<h2>`를 씀 — 즉 카드 제목이 형제 섹션들보다 오히려 한 단계 더 깊게 되어 있던 불일치). 카드 제목을 `<h2>`로 올리고, CSS의 대응 셀렉터(`.cardTitleRow h3`→`h2`, `.card h3`→`h2`)도 함께 수정 — 두 파일 다 다른 `<h2>`들이 별도 클래스로 스코프돼 있어 셀렉터 충돌 없음을 사전 확인
  - **3차 발견 — 손익 계산기 차트 세그먼트의 포커스 표시가 `outline: none`만 두고 `filter: brightness(1.1)`만 대체 표시로 씀**: 밝기 변화만으로는 (특히 색맹 사용자에게) 충분히 뚜렷한 표시가 아니라고 판단해, `:hover`와 `:focus-visible`을 분리하고 `:focus-visible`에만 `box-shadow: 0 0 0 3px var(--accent-color)`로 실제 포커스 링을 추가(마우스 클릭 시에는 안 보이고 키보드 포커스 시에만 보이도록 `:focus-visible` 유지)
  - **체커 자체의 버그도 이 과정에서 발견해 수정**: `effectiveBackground()`가 `background-color: rgba(...)`처럼 반투명한 배경을 만나면 그 알파값을 무시하고 원색 그대로 완전 불투명인 것처럼 취급하고 있었음(전경색에는 이미 있던 `compositeOverBackground()` 알파 합성을 배경 쪽에는 적용한 적이 없었음) — 위 "운영중" 배지에서 실제로는 연한 민트색 배경인데 진한 원색 에메랄드 배경으로 오판해 최초엔 1.0:1(사실상 같은 색)로 보고하는 것으로 발견. `effectiveBackground()`를 조상 체인의 배경 레이어를 전부 모아뒀다가 불투명 배경(또는 기본 흰색)을 만날 때까지 바깥쪽부터 안쪽으로 알파 합성하도록 재작성. 합성 로직 자체는 새 문법(3-value `rgb(r g b)`)으로 반환하는데 기존 `parseColor()`가 이 문법을 이미 지원하고 있어 별도 파서 수정 불필요. 수정 전/후로 v1.1 회귀 테스트(4개 시나리오) 재실행해 기존 동작이 그대로 유지됨을 확인
  - **검증**: 매 수정 단계마다 `npx tsc --noEmit`/`npm run lint`/`next build` 통과 확인. 로컬에서 `next build && next start`로 실제 프로덕션 빌드를 띄우고(포트 3011→3014 순차 사용, 코드 변경마다 재기동), `tsx` 스크립트로 `/api/seo-check`와 동일한 절차(HTML+외부 CSS 3개 fetch 후 `analyze()`)를 재현해 다음 10개 경로 전부 재검증: `/`, `/about`, `/ai-apps`, `/biz`, `/dashboard`, `/tools/quote-generator`, `/tools/profit-calculator`, `/tools/report-checker`, `/tools/llms-txt-generator`, `/tools/seo-geo-checker`(모두 `ko`·`en` 두 로케일 확인). **최종 결과: 접근성 관련 fail 0건, 도구 5개 페이지는 전부 100/A(ALL PASS), 나머지 페이지도 92~96/A** — 유일하게 남은 항목은 홈/about/ai-apps/biz/dashboard의 "포커스 표시" warn인데, 이는 실제 문제가 아니라 그 페이지들이 fetch하는 CSS 청크 3개 안에 `:focus` 규칙 자체가 없어서(폼 입력이 없는 페이지들이라 당연함) 체커가 "확인 불가"로 정직하게 보고하는 것 — 코드베이스 전체에서 `outline:\s*none`을 grep해 실제 존재하는 모든 `outline:none` 사용처(폼 인풋 focus 등 8곳)를 전수 확인한 결과 전부 `border-color`/`box-shadow` 등 대체 표시를 이미 갖추고 있어 실제 위반은 없음을 별도로 검증함
  - **범위에서 하지 않은 것**: `admin/login`·`PostForm`·`LogoutButton`·`TagList` 등은 `background-color`/`border-color`로만 accent-color를 썼던 곳이라(순수 텍스트 색상 용도가 아님) 이번 일괄 치환 대상이 아니었고 실제로도 문제가 없었음(3:1 비텍스트 대비 기준은 여유 있게 통과). 로그인 화면 자체의 실사용 브라우저 검증(실제 로그인 후 화면)은 이번 세션에서 진행하지 않음 — 코드 레벨 검증(수동 대비 계산 + grep 전수 조사)만 수행
  - **미배포 상태**: 이번 수정은 로컬 커밋 전 단계 — 실제 `nexalab.app`에는 아직 반영되지 않았음. 커밋/푸시하면 Vercel 자동 배포로 이어짐

- **Google Analytics(gtag.js, 측정 ID `G-VD5HTETDVH`) 추가**: `src/app/[locale]/layout.tsx`의 `<head>`에 기존 AdSense 스크립트(`next/script`, `strategy="afterInteractive"`) 바로 다음 줄에 같은 패턴으로 추가 — gtag 로더 `<Script>` 1개 + `dataLayer`/`gtag()` 초기화 인라인 `<Script id="google-analytics">` 1개. AdSense와 동일하게 공개 페이지 레이아웃에만 적용, 별도 root layout을 쓰는 `/admin`에는 추가하지 않음(관리자 화면은 로그인 필요라 공개 트래픽 분석 대상이 아니라고 판단, 확인 없이 진행). 측정 ID는 AdSense 클라이언트 ID와 동일하게 코드에 하드코딩(기존 컨벤션 따름, 환경변수화하지 않음). `next build && next start`로 실제 렌더링된 HTML에 스크립트 태그가 포함되는지 확인함

- **Service Worker 버전 자동 관리**: `public/sw.js`에는 `skipWaiting()`/`clients.claim()`이 이미 구현돼 있었지만, `CACHE_NAME`이 `"nexalab-shell-v1"` 고정 문자열이라 배포해도 파일 바이트가 그대로라 브라우저가 새 서비스워커를 감지 못할 수 있는 문제가 있었음(브라우저는 sw.js를 바이트 단위로 비교해 업데이트 여부를 판단)
  - `scripts/generate-sw.mjs`(신규): `public/sw.js`의 `CACHE_NAME` 버전 부분을 매 빌드마다 새 값으로 치환. 버전 소스 우선순위 — ① Vercel이 빌드 시 제공하는 `VERCEL_GIT_COMMIT_SHA` 환경변수(가장 신뢰도 높음, git CLI 불필요) → ② 로컬 빌드용 `git rev-parse --short=12 HEAD` → ③ 위 둘 다 실패하면(git 없음 등) `Date.now().toString(36)`. ESLint의 `@typescript-eslint/no-require-imports` 규칙이 일반 `.js` 파일에도 적용돼 `require()` 기반 CJS로 작성한 최초 버전이 lint 실패해, `.mjs` 확장자 + `import`/`fileURLToPath` 기반 ESM으로 다시 작성함(패키지 전체를 `"type": "module"`로 바꾸지 않고도 이 스크립트만 ESM으로 실행 가능)
  - `package.json`에 `"prebuild": "node scripts/generate-sw.mjs"` 추가 — npm의 pre/post 스크립트 훅 규약에 따라 `npm run build`(및 Vercel의 빌드 명령) 실행 시 `next build`보다 항상 먼저 자동 실행됨. 별도 CI 설정 변경 불필요
  - 치환 대상 패턴을 못 찾으면(예: 파일 구조가 크게 바뀌어 정규식이 더 이상 안 맞는 경우) 빌드 자체를 실패시키도록 `process.exit(1)` — 버전 주입이 조용히 스킵된 채 배포되는 것을 방지
  - `public/sw.js`에는 "버전은 빌드 스크립트가 자동으로 덮어쓴다"는 주석을 추가해, 저장소에 커밋된 `"nexalab-shell-v1"` 값 자체는 플레이스홀더일 뿐이고 실제 배포본에서는 항상 커밋 해시 기반 값으로 바뀐다는 걸 명시
  - **검증**: `node scripts/generate-sw.mjs` 단독 실행 및 `npm run build`(prebuild 훅 경유) 양쪽 모두 `public/sw.js`의 `CACHE_NAME`이 현재 HEAD 커밋 해시 기반 값(예: `nexalab-shell-v18fbbc28c5ae`)으로 정상 치환되는 것을 확인 후, 커밋용으로는 플레이스홀더 `v1`로 되돌려둠(실제 배포 시 Vercel 빌드가 다시 덮어씀). `npx tsc --noEmit`/`npm run lint`/`next build` 모두 통과

- **블로그 발행 → 채널별 홍보 문구 자동 생성 → 노션 저장 GitHub Actions 워크플로우 신규 구현** (`blog-promo-automation-claude-code-prompt.md` 지침 기준, 이 파일은 `.gitignore`의 `*.md` 규칙에 걸려 저장소에는 커밋되지 않는 로컬 지침서). nexalab.app 블로그가 마크다운 파일이 아니라 Supabase `posts` 테이블 기반이라는 점이 지침서 원안(콘텐츠 디렉토리 스캔 가정)과 달라, "새 글 감지" 로직을 Supabase 쿼리 기반으로 설계함
  - `scripts/promo-automation/detect-new-posts.ts`: `.last-run.json`의 `lastRunAt`보다 `updated_at`이 큰 `published=true` 글을 Supabase(anon 키, RLS로 공개 글만 조회 가능)에서 조회. `updated_at`은 글 생성/수정 시 항상 앱 코드가 명시적으로 채우는 컬럼이라(`api/admin/posts/route.ts` 참고) "생성되거나 수정된 글"이라는 지침서 기준과 정확히 일치 — 초안이었다가 나중에 발행 처리된 글도 자연스럽게 잡힘. 카테고리 `locale`로 `/ko/posts/[id]` · `/en/posts/[id]` URL을 구성. `.last-run.json`이 없는 최초 실행 시에는 과거 발행 글 전체(현재 29개+)가 한꺼번에 감지되어 쿼터를 소진하는 것을 막기 위해 기본값을 24시간 전으로 설정(`lastRun.ts`)
  - `scripts/promo-automation/generate-copy.ts`: `@google/generative-ai` SDK 사용(지침서가 명시적으로 이 SDK를 지정 — 프로젝트의 다른 Gemini 연동은 REST 직접 호출 방식이지만 이번엔 지침서 요구사항을 그대로 따름), 모델은 기존 코드베이스(`api/quote/route.ts`, `reportCheckerGemini.ts`)와 동일한 `gemini-3.1-flash-lite` 재사용. `systemInstruction`에 55세 사무직 타겟·"불편함을 질문 → AI 해결 한 줄 → 행동 유도" 카피 공식·존댓말체를 명시하고 `responseMimeType: "application/json"` + 코드펜스 제거 방어 코드로 파싱. 글 사이 5초 딜레이(무료 티어 RPM 대응), 429 에러는 로그에 "다음 실행에 재시도됩니다" 별도 표시
  - `scripts/promo-automation/save-to-notion.ts`: `@notionhq/client` v5(Notion API 버전 `2025-09-03`) 사용 — 이 버전부터 데이터베이스 조회가 `databases.query`가 아니라 `dataSources.query`로 이동한 것을 타입 에러로 발견(구버전 API를 가정한 지침서 원문과 달랐던 부분). `databases.retrieve()`로 `data_sources[0].id`를 먼저 얻어와 그 ID로 URL 중복 여부를 조회하되, `pages.create()`의 `parent`는 SDK가 하위호환으로 `{ database_id }`를 그대로 허용해 페이지 생성 자체는 원안대로 유지
  - **재시도 설계**: 문구 생성이나 노션 저장 중 하나라도 실패한 글이 있으면 `.last-run.json`을 갱신하지 않고 이전 시각을 그대로 유지 — 다음 실행 때 실패한 글이 다시 감지되게 하는 재시도 메커니즘(지침서의 "다음 실행에 재시도됨" 로그 문구를 실제 동작으로 뒷받침). 이미 성공적으로 노션에 저장된 글은 URL 기준 중복 체크로 걸러지므로 재조회돼도 중복 저장되지 않음. 반대로 전부 성공하면 detect 시점에 캡처해둔 타임스탬프로 갱신
  - 세 스크립트 사이의 데이터 전달은 `scripts/promo-automation/.state/`(신규, `.gitignore` 추가)에 임시 JSON으로 저장 — `.last-run.json`과 달리 실행마다 새로 쓰고 버리는 값이라 커밋 대상에서 제외
  - `package.json`에 `promo:detect`/`promo:generate`/`promo:save`/`promo:test`(`tsx` 기반) 스크립트 추가, `tsx`·`dotenv`를 devDependencies로 신규 도입(로컬 실행 시 `.env.local`을 자동 로드하되 이미 설정된 값은 덮어쓰지 않아 GitHub Actions 환경에서도 그대로 재사용 가능). `promo:test`(`run-all.ts`)는 실제 워크플로우와 동일한 순서로 세 스크립트를 별도 프로세스로 실행하는 오케스트레이터
  - `.github/workflows/promo-automation.yml`(신규): 매일 UTC 23:00(KST 오전 8시) cron + `workflow_dispatch`. Supabase 자격증명은 새 시크릿을 추가하지 않고 `supabase-healthcheck.yml`이 이미 쓰는 `SUPABASE_URL`/`SUPABASE_ANON_KEY` repo secret을 재사용(anon 키는 어차피 배포된 사이트의 브라우저 번들에도 노출되는 값이라 민감정보가 아님). `stefanzweifel/git-auto-commit-action@v5`로 `.last-run.json` 변경사항만 커밋
  - **검증**: `npx tsc --noEmit`, `npm run lint`, `next build` 모두 통과. `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`GEMINI_API_KEY`가 이미 있는 `.env.local`로 `npm run promo:detect` → 실제 Supabase에서 새 글 11건(한/영 로케일 혼합) 정상 감지 확인, 이어서 `npm run promo:generate`로 11건 전체에 대해 실제 Gemini 호출까지 성공(429 없이 완료, 네이버/카톡/페이스북 3종 문구가 톤·길이 조건대로 생성되고 URL도 포함됨을 직접 확인). `save-to-notion.ts`는 로컬에 `NOTION_API_KEY`/`NOTION_DATABASE_ID`가 없어 실제 저장까지는 검증하지 못함 — 필수 환경변수 누락 시 명확한 에러로 종료하는 것만 확인. 테스트에 사용한 `.state/` 임시 파일은 삭제, `.last-run.json`은 실제 파이프라인이 끝까지 성공한 적이 없어 초기 플레이스홀더 값(`2026-08-22T00:00:00.000Z`) 그대로 유지됨
  - **사용자 작업 필요** (지침서의 "사전 준비물"과 동일):
    1. 노션에 데이터베이스 생성 — 속성 이름을 정확히 "글 제목"(title)/"글 URL"(url)/"발행일"(date)/"네이버 문구"(rich_text)/"카톡 문구"(rich_text)/"페이스북 문구"(rich_text)/"상태"(select, 기본값 "대기")로 맞추고, 발급받은 Integration을 이 데이터베이스에 연결(Connect)
    2. GitHub repo Settings > Secrets에 `GEMINI_API_KEY`(기존 서비스 쿼터와 분리 권장), `NOTION_API_KEY`, `NOTION_DATABASE_ID` 등록 — `SUPABASE_URL`/`SUPABASE_ANON_KEY`는 이미 등록되어 있어 추가 불필요
    3. **`save-to-notion.ts`의 실제 노션 저장 동작은 다음 세션에서 위 시크릿 등록 후 `npm run promo:test` 또는 워크플로우 수동 실행(`workflow_dispatch`)으로 end-to-end 재확인 권장**

- **블로그 홍보 자동화 후속: `npm run promo:test` 실제 실행으로 발견한 버그 2건 수정 + 노션 저장까지 end-to-end 검증 완료**
  - **버그 1 (코드) — Gemini JSON 파싱 실패**: 영문 글(#5, "Guardrails for Agents...") 처리 중 `Unexpected non-whitespace character after JSON` 에러로 실패. `responseMimeType: "application/json"`을 지정해도 응답에 후행 텍스트가 붙는 경우가 실제로 관측됨 — 단순 코드펜스 제거(`stripJsonFence`)로는 못 잡는 케이스. `lib/reportCheckerGemini.ts`가 이미 쓰는 패턴대로 "첫 `{`부터 마지막 `}`까지만 추출"하는 `extractJson()`으로 교체해 해결(`generate-copy.ts`)
  - **버그 2 (설정) — NOTION_DATABASE_ID 값 자체가 잘못됨**: 사용자가 처음 넣은 값은 데이터베이스 URL의 `?v=...` 뷰 ID였고(노션 뷰 ID는 API로 조회 불가), 이후 `/p/...` 페이지 ID로 바꿔봐도 여전히 실패 — 두 값 모두 실제 API가 쓰는 ID와 다름. `notion.search()`로 이 Integration이 실제 접근 가능한 객체 목록을 직접 조회해 제목이 "블로그 홍보 문구 관리"로 일치하는 `data_source` 객체를 찾아 진짜 유효한 ID(`3c463e2359078021876c000b7d7c5be8`)를 확보 — 이 데이터베이스는 `database_parent: {type: "workspace"}` 구조라 별도의 "database" 오브젝트 자체가 없어(Notion 2025-09-03 API의 새 모델), `databases.retrieve()`가 항상 object_not_found로 실패하는 케이스였음
    - `save-to-notion.ts`의 `resolveTarget()`(구 `resolveDataSourceId()`)을 database_id 우선 시도 → 실패 시 data_source_id로 폴백하는 이중 경로로 재작성해 이런 케이스에서도 동작하도록 일반화. `pages.create()`의 `parent`도 어느 경로로 해결됐는지에 따라 `{database_id}`/`{data_source_id}`를 동적으로 선택
    - `.env.local`의 `NOTION_DATABASE_ID`를 위에서 확인한 유효 값으로 갱신(로컬 전용, 커밋 안 됨)
  - **버그 3 (설정) — 노션 데이터베이스 속성명이 지침서 스펙과 다름**: 실 저장 시도에서 `"글 제목 is expected to be rich_text. 네이버 문구 is not a property that exists."` 검증 에러 발생. `dataSources.retrieve()`로 실제 속성 목록을 조회해 확인한 결과: (1) Notion 필수 title 속성의 실제 이름이 "글 제목"이 아니라 **"문구"**였고 "글 제목"은 별도로 만들어진 rich_text 컬럼이었음, (2) "네이버 문구"가 아니라 공백 없는 **"네이버문구"**였음. 사용자에게 노션 컬럼명을 다시 맞추라고 요구하는 대신, 코드(`PROP` 매핑)를 실제 스키마에 맞게 조정하는 쪽을 택함 — `title`은 "문구"에 쓰고, 기존에 남겨둔 "글 제목"(rich_text) 컬럼에도 같은 제목 텍스트를 중복 기록(`titleDisplay`)해 노션 보기 화면에서도 자연스럽게 보이도록 함
  - **검증**: 수정 후 `npx tsc --noEmit`/`npm run lint` 통과. `npm run promo:test`(전체 파이프라인)를 다시 돌려 문구 생성 11/11 성공 확인 → 저장 단계에서 실제로 노션 데이터베이스에 11개 행이 정상 생성되는 것까지 최초로 확인(`.last-run.json`이 실행 타임스탬프로 정상 갱신됨). 이어서 `npm run promo:detect`로 재실행 시 새 글 0건(정상 스킵) 확인, `npm run promo:save`를 같은 데이터로 재실행해 URL 중복 체크로 11건 전부 "이미 저장됨, 스킵" 처리되는 것까지 확인 — 재시도/중복방지 설계가 실제로도 의도대로 동작함을 검증
  - **사용자 작업 필요**: GitHub repo secret의 `NOTION_DATABASE_ID`도 로컬과 동일한 값(`3c463e2359078021876c000b7d7c5be8`)으로 등록/수정 필요 — 처음 등록했던 값이 있다면 위 버그 2와 같은 이유로 잘못된 값일 가능성이 높음
  - 검증 과정에서 사용한 `scripts/promo-automation/notion-diagnose.ts`(Integration 접근 가능 객체 조회, 속성 스키마 확인용 1회성 스크립트)는 확인 후 삭제, 커밋되지 않음

### 2026-08-27
- **홍보 문구 자동화에 네이버 밴드 채널 추가 후 실제 저장 실패 진단·해결**: 커밋 `c094278`(2026-08-25)에서 코드(`generate-copy.ts`/`save-to-notion.ts`/`types.ts`)는 이미 네이버/카톡/페이스북 3채널에 밴드용 문구(`bandTitle`/`bandCopy`)를 추가했으나, 노션 데이터베이스에는 대응하는 "네이버밴드 문구" 컬럼이 없어 8/25~8/27 사이 `promo-automation.yml` 실행 5건이 전부 `네이버밴드 문구 is not a property that exists.` 검증 에러로 실패하고 있었음(사용자가 "밴드 문구가 생성 안 된다"고 보고)
  - 원인은 코드가 아니라 노션 DB 설정 누락이었음 — `save-to-notion.ts` 상단 주석에도 "컬럼을 수동으로 추가해야 저장이 성공한다"고 이미 기록돼 있었으나 실제로는 아직 추가되지 않은 상태였던 것
  - 사용자가 노션에 "네이버밴드 문구"(rich_text) 컬럼 추가 후, 밀려 있던 글 5건(영문 "Agentic Shift" 시리즈 2건, 한글 재무/UI·UX/기획 관련 3건)을 `gh workflow run promo-automation.yml -f post_id=<id>`로 하나씩 수동 재실행해 전부 노션 저장 완료까지 확인. `.last-run.json`에 7개 post_id 전부 반영됨
  - 재시도 중 무관한 1회성 이슈도 함께 관측: 첫 재시도(`2621b3ec-...`)에서는 Gemini가 이번엔 `bandTitle`/`bandCopy`를 포함한 JSON을 온전히 반환하지 못해 `generate-copy` 단계에서 실패 — 노션 컬럼 문제와 무관한 일시적 응답 품질 이슈로, 재시도 설계(실패한 글은 `.last-run.json`에 기록 안 됨) 덕분에 곧바로 재실행해 정상 처리됨. 별도 코드 수정 불필요
  - **결론**: 앞으로 새 글이 발행되면(repository_dispatch) 4채널(네이버/카톡/페이스북/밴드) 문구가 모두 정상적으로 생성·저장됨

### 2026-08-29
- **애드센스 재심사 대응: 툴 4종 페이지에 SEO/GEO 친화적 텍스트 콘텐츠 블록 추가** (`adsense-tool-content-guide.md` 지침 기준) — "가치가 별로 없는 콘텐츠" 반려 사유 대응을 위해 견적서 생성기·손익 계산기·SEO/GEO 체커·report-checker 4개 페이지에 도입부+사용법+추천 대상+FAQ 텍스트 블록을 추가
  - **아키텍처는 지침서를 그대로 따르지 않고 프로젝트 컨벤션에 맞게 조정**: 지침서는 `content/tool-copy/*.ts`(한국어 하드코딩) + `components/tool-content/*` 구조를 제시했으나, 이 프로젝트는 이미 모든 UI 문구를 `next-intl`(`messages/ko.json`/`en.json`)로 관리하는 컨벤션이 확립돼 있어(2026-08-18 다국어 도입 이후 전 페이지 동일 패턴) 콘텐츠 데이터는 별도 `.ts` 파일이 아니라 각 툴의 기존 네임스페이스(`quoteGenerator`/`profitCalculator`/`seoGeoChecker`/`reportChecker`) 안에 `content*` 접두사 키로 추가 — 배열(단계/추천목록/FAQ)은 `next-intl` 4.x의 `t.raw()`로 그대로 꺼내 씀. 덕분에 지침서에는 없던 영문 버전까지 4개 페이지 전부 자연스럽게 확보됨(기존 다국어 원칙과 일치)
  - `src/components/tool-content/`(신규): `ToolIntro`(도입부, 제목+문제제기+해결요약) / `ToolHowToUse`(3~4단계 카드) / `ToolRecommendFor`(체크 아이콘 bullet) / `ToolFAQ`(질문-답변 + `FAQPage` JSON-LD를 `<script type="application/ld+json">`로 자동 삽입, 기존 `JsonLd` 컴포넌트 재사용) / `ToolRelatedPosts`(선택, posts 배열이 비어있으면 렌더링 자체를 생략) / `ToolContentWrapper`(위 컴포넌트들을 감싸며 `children` 슬롯에 기존 툴 UI를 그대로 유지 — 지침서의 "기존 툴 UI/로직은 건드리지 않음" 원칙 그대로 반영)
  - 각 페이지(`page.tsx`, 4개 파일 동일 패턴)에서 `getTranslations`로 이미 받아온 서버 컴포넌트 `t`에 `t("content...")`/`t.raw("content...")` 호출을 추가해 `ToolContentWrapper`에 전달, 기존 툴 클라이언트 컴포넌트(`QuoteGeneratorClient` 등)는 `children`으로 감싸기만 해서 변경 없음
  - **"관련 글 링크"(지침서 5번, 선택 항목)는 이번 범위에서 구현하지 않음**: `dashboard/page.tsx`의 `getSeoRelatedPost()`처럼 `posts.tags`로 관련 글을 매칭하는 패턴이 이미 있어 재사용을 검토했으나, 실제 Supabase `posts` 테이블을 조회해보니 전체 글의 태그가 전부 `["AutoPoster"]`(또는 `"AI News"`)뿐이라 4개 툴 주제(견적/프리랜서/손익/SEO/보고서 작성)와 매칭되는 글이 하나도 없음을 확인 — 무관한 글을 억지로 연결하지 않기 위해 `ToolRelatedPosts` 컴포넌트만 만들어두고 실제 페이지에는 연결하지 않음(향후 관련 태그를 가진 글이 생기면 dashboard와 동일한 패턴으로 붙이면 됨)
  - 콘텐츠 카피 방향은 지침서 3번 표를 그대로 따름(각 도구별 "이런 고민 있으신가요?" 문제 제기 → 해결 요약 → 3~4단계 사용법 → 추천 대상 4개 → FAQ 5개, 손익 계산기 FAQ에는 지침서 지시대로 "세무 상담 권장" 면책 문구 포함)
  - **검증**: `npx tsc --noEmit`, `npm run lint`, `next build`(Turbopack, `/ko`·`/en` 양쪽 4개 툴 페이지 전부 SSG(`●`) 정적 생성 확인 — 지침서 4번 체크리스트의 "CSR만 되면 크롤러가 못 읽음" 우려에 해당 없음) 모두 통과. 빌드 산출물(`.next/server/app/{ko,en}/tools/*.html`)을 직접 grep해 도입부 텍스트와 `"@type":"FAQPage"` JSON-LD가 4개 페이지 모두의 정적 HTML에 실제로 포함되는 것을 확인(지침서 4번 "curl로 SSR 여부 확인" 항목에 해당), 본문 텍스트 분량도 4개 페이지 전부 1,400~1,750자로 목표(600~800자) 상회. `next start`로 로컬 프로덕션 서버를 띄우고 Chrome 자동화로 견적서 생성기(ko, 데스크톱 1400px)·report-checker(en) 페이지가 실제로 정상 렌더링되는 것을 스크린샷으로 확인(도입부 카드, 단계 그리드, 추천 목록, FAQ 목록 모두 레이아웃 정상) — **모바일 실제 폭(390px) 스크린샷은 이번에도 리사이즈 도구가 뷰포트에 반영되지 않아 검증하지 못함**(과거 세션에도 반복된 동일한 도구 한계, 2026-08-21/2026-08-22 기록 참고). 다만 새 CSS(`ToolContent.module.css`)의 반응형 그리드는 기존에 이미 모바일 검증을 마친 `.choiceGrid`/`.resultGrid` 등과 동일한 `grid-template-columns: 1fr` → `repeat(2, 1fr)`(640px 기준) 패턴을 그대로 재사용해 깨질 가능성은 낮다고 판단
  - **이번 범위에서 하지 않은 것**: Google Search Console "URL 검사"·실시간 색인 요청, About 페이지(지침서 2순위) 작업, 애드센스 재심사 요청 자체 — 전부 사용자가 배포 후 직접 진행해야 하는 대시보드/외부 서비스 작업

- **애드센스 재심사 대응 2순위: About·카테고리 인트로 콘텐츠 보강** (`adsense-about-category-guide.md` 지침 기준) — 1순위(툴 페이지) 작업에 이어, 사이트 기본 골격(About·카테고리)의 신뢰도·완성도를 보강
  - **착수 전 조사 결과, 지침서 체크리스트 상당 부분이 이미 충족돼 있음을 확인**(과거 세션에서 별도로 작업된 것으로 보임, 이번 세션 로그에는 해당 작업 기록이 없어 정확한 시점은 불명):
    - Privacy Policy(`privacy` 네임스페이스): 서비스명(NexaLab.app)·운영자명·GA4/AdSense 쿠키 수집 항목·Supabase/Vercel 등 제3자 서비스·보유기간·연락처까지 이미 10개 섹션으로 상세히 구성돼 있어 추가 보강 불필요로 판단, 변경하지 않음
    - Contact 페이지: 이메일 카드 + 문의 유형 4종(협업·광고·버그·기타, 유형별 아이콘/설명/메일 subject 프리셋) + 소셜 링크 + 응답 안내까지 이미 구조화돼 있어 "1~2줄뿐인 빈약한 콘텐츠"에 해당하지 않음, 변경하지 않음
    - Footer(`Footer.tsx`)의 Contact 링크: 이미 `mailto`/난독화 이메일이 아니라 `/contact`(로케일 인식 `Link`)로 연결되어 있어 지침서가 우려한 문제가 해당 없음
    - 카테고리 10개 미만 통합/삭제 검토: 실제 Supabase `categories` 테이블을 조회해 카테고리별 발행 글 수를 확인한 결과 AI Applications(ko) 51편, Business & Ideas(ko) 20편, **AI Job News(en) 13편**(이전 세션 로그에는 등장한 적 없는 카테고리 — 별도 세션에서 생성된 것으로 추정) 전부 10편을 훨씬 상회해 통합/삭제 대상 없음
  - **실제로 보강한 것 — About 페이지**(`src/app/[locale]/about/page.tsx`): 지침서 1-1 표의 5개 요소 중 이미 있던 저자 소개(프로필 카드, 실명+직함+GitHub/LinkedIn)·콘텐츠 요약(Coverage 3카드)·연락 방법(Contact 섹션)은 유지하고, 빠져 있던 2개 섹션을 신규 추가
    - "왜 도구를 전부 무료로 제공하나요"(`philosophyTitle`/`philosophyBody`, 약 227자): 지침서 1-1이 명시적으로 권장한 "무료 툴을 트래픽 훅으로 쓰는 전략 자체를 솔직하게 설명" 방향을 그대로 반영 — 광고 수익 확보 목적과 무저장 원칙 유지를 함께 명시해 방문자 신뢰를 해치지 않는 톤으로 작성
    - "콘텐츠는 어떻게 만들어지나요"(`principleTitle`/`principleBody`, 약 225자): 기존에 있던 한 줄짜리 `disclosureText`("AI와 함께 작성합니다")를 지침서 1-2 "AI 생성 콘텐츠는 투명하게, 검수 프로세스와 함께 명시" 원칙에 맞춰 정식 섹션으로 확장 — AI 초안+사람 검수 프로세스, 무료 도구 4종도 직접 사용하며 다듬는다는 점, 대략적인 업데이트 주기(주 1~2회)까지 포함. 기존 `disclosureText` 키와 전용 CSS(`.disclosure`)는 더 이상 쓰이지 않아 함께 제거
    - 두 섹션 모두 기존 `storySection` 클래스(글래스 카드, 좌측 정렬 h2+p)를 그대로 재사용해 새 CSS 없이 기존 디자인 톤과 일치시킴
  - **실제로 보강한 것 — 카테고리 인트로**(`src/app/[locale]/page.tsx`의 `CATEGORY_INTRO`/`CATEGORY_ICONS`): 기존 ai-apps/biz-ideas(ko) 인트로가 각각 36~38자로 지침서 목표(200~300자)에 크게 못 미쳐, 지침서 2-2 템플릿("[카테고리]는 [주제범위]... 주로 [하위주제]... [타겟독자]에게... [추천 상황]")대로 확장(약 225~248자). 위에서 발견한 세 번째 카테고리 **AI Job News(en, 13편)**는 `CATEGORY_INTRO`/`CATEGORY_ICONS`(📰) 맵 자체에 아예 없어 `/en` 홈에서 카테고리 탭을 눌러도 인트로 블록이 노출되지 않던 상태였음 — 신규로 영문 인트로(약 470자)를 작성해 추가
    - `ai-job-news`는 실제 글 내용이 전부 영어(해외 AI 트렌드 뉴스)라 한국어 사이트(`/ko`)에서는 이 카테고리 자체가 노출될 일이 없지만(카테고리는 `locale` 컬럼으로 분리 운영), 기존 ai-apps/biz-ideas가 en.json에도 대칭으로 복사돼 있던 기존 컨벤션을 따라 ko.json에도 동일 키를 함께 추가(실사용은 안 되지만 두 메시지 파일 간 키 대칭 유지)
  - **검증**: `npx tsc --noEmit`, `npm run lint`, `next build`(Turbopack, `/ko`·`/en` 양쪽 `/about` SSG 정적 생성 확인) 모두 통과. 빌드 산출물(`.next/server/app/{ko,en}/about.html`)을 직접 확인해 새 섹션 텍스트가 실제 정적 HTML에 포함되는 것과 본문 텍스트 분량(태그/헤더 제외 순수 텍스트 기준 ko 약 1,981자, en 약 3,457자 — 지침서 목표 1,000자를 크게 상회)을 확인. `next start` 로컬 프로덕션 서버 + curl로 `/ko?category=ai-apps`, `/ko?category=biz-ideas`, `/en?category=ai-job-news` 세 조합 모두 새 인트로 텍스트가 SSR 응답에 포함되는 것을 확인(1순위와 동일한 검증 방식). Chrome 자동화로 `/ko/about`(신규 두 섹션 레이아웃)과 `/ko?category=ai-apps`(확장된 카테고리 인트로) 실제 렌더링을 스크린샷으로 확인 — 레이아웃 깨짐 없음
  - **이번 범위에서 하지 않은 것**: Google Search Console URL 검사·색인 요청, 삭제/통합된 카테고리가 없어 301 리다이렉트 작업 자체가 불필요, 애드센스 재심사 요청 자체는 1·2순위 전부 완료 후 사용자가 직접 진행

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
