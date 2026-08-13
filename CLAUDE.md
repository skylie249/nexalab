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

### 🔜 예정 (블로그 개선, 우선순위 낮음 — 아래 신규 기능 이후 진행)
- [ ] 코드 블록 복사 버튼
- [ ] 읽는 시간 표시
- [ ] 목차(TOC) + 스크롤 하이라이트
- [ ] 카테고리 필터 UI (`ALL` 탭 실제 필터화)
- [ ] Live Sub-Apps ↔ 관련 포스트 연결

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

- [ ] **1단계 (MVP)**: 텍스트 붙여넣기 → Gemini API 분석 → 결과 화면 (파일 업로드 없이 텍스트 인풋으로 먼저 검증, 저장 없이 응답만 반환)
- [ ] **2단계**: 파일 업로드 추가 (PDF: `pdf-parse`, DOCX: `mammoth`) — 파싱 후 메모리 즉시 폐기
- [ ] **3단계**: 요청서 작성 도우미(위저드) 추가 — 질문형 UI + Gemini API로 요청서 텍스트 자동 생성 (저장 없음)
- [ ] **4단계**: 결과를 PDF 견적서로 export (`@react-pdf/renderer`) — 서버 저장 없이 즉석 생성/스트리밍
- [ ] **5단계**: Rate limiting 적용 (DB 없이 Vercel Edge/미들웨어 기반 IP 제한 방식으로 구현)
- [ ] **6단계**: `industryPresets` 설정 파일 데이터 채우기 (업종별 시장 평균 단가 조사 필요, 코드 기반 관리 유지)

### 마케팅/배포 계획 (참고)
- Product Hunt 등록 (무료 AI 도구, "견적서" 관련 키워드는 반응 좋은 편)
- 커뮤니티 배포: 디스콰이엇, 요즘IT, OKKY 등 개발자/사업가 커뮤니티
- 결과 화면에 공유 유도 문구 삽입 (예: "이 견적서는 [nexalab.app]에서 AI로 생성되었습니다")
- 블로그 콘텐츠 연동: "AI 견적서 생성기를 만든 과정" 시리즈 글 → 도구 출시와 동시에 발행
- **"업로드하신 자료는 저장하지 않습니다" 문구를 신뢰 포인트로 명시** — 기밀 문서를 다루는 도구 특성상 랜딩/결과 화면에 눈에 띄게 배치 권장

---

## 기술 스택 참고

| 구성 요소 | 사용 기술 |
|---|---|
| 파일 업로드 처리 | 요청 처리 중 메모리에서만 파싱 (Supabase Storage 등 영속 저장소 미사용) |
| PDF 텍스트 추출 | `pdf-parse` 또는 `pdfjs-dist` |
| DOCX 텍스트 추출 | `mammoth` |
| AI 분석 (견적 분석 + 위저드 요청서 생성) | **Gemini API** (`@google/generative-ai`, 모델: `gemini-2.5-flash`) |
| 결과 저장 | **저장 없음** — API 응답으로만 반환, 클라이언트 상태(React state)로만 유지 |
| PDF 생성 (견적서 export) | `@react-pdf/renderer`, 서버 저장 없이 즉석 생성/스트리밍 |
| Rate limiting | DB 없이 Vercel Edge Middleware 또는 in-memory 방식 |
| 환경변수 | `GEMINI_API_KEY` (.env.local 필요) |

> 참고: 기존 사이트에서 Supabase는 블로그 포스트 관리용으로는 계속 사용하되, 이 견적서 생성기 기능에서는 사용하지 않음.

## 작업 시 참고 사항

- 기존 사이트에 이미 다크모드, 카테고리 구조(AI Apps/Biz)가 있으므로 신규 기능도 이 톤앤매너에 맞출 것
- Supabase 클라이언트는 서버/클라이언트 분리해서 사용 (`@supabase/ssr` 패키지 활용) — 단, 견적서 생성기 기능 자체에는 Supabase 미사용
- 새 기능은 별도 라우트로 구성 권장 (예: `/tools/quote-generator`)
- **AI 분석 엔진은 Gemini API로 통일**할 것 (Anthropic API 사용하지 않음) — 견적 분석, 위저드 요청서 생성 모두 동일하게 적용
- 위저드 경로와 업로드/붙여넣기 경로는 최종적으로 동일한 "견적 분석 API"로 합류하는 구조 유지 (분기는 입력 단계에서만)
- **DB 저장 지양 원칙 준수**: 사용자가 업로드/입력한 요청서 내용과 AI 분석 결과는 어떤 형태로도 서버에 영속 저장하지 않음. 새 기능을 추가할 때도 이 원칙을 기본값으로 유지하고, 저장이 필요해 보이는 요구사항이 생기면 먼저 "정말 저장해야 하는가"를 검토할 것
