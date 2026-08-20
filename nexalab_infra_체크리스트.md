# [인프라 운영 체크리스트] nexalab.app 스택 점검 & SEO·GEO 체커 대비

**작성일**: 2026-08-20
**대상**: nexalab.app 운영 인프라 (Cloudflare / Vercel / Supabase / Next.js / Gemini API 무료 / GitHub)
**작성 목적**: 현재 스택의 무료 티어 한계를 파악하고, SEO·GEO 점검 도구 등 트래픽 스파이크가 예상되는 기능 도입 전 안정성 확보
**핸드오프 대상**: Claude Code 구현 지침서

---

## 0. 요약 — 우선순위 매트릭스

| 우선순위 | 항목 | 예상 소요 시간 | 이유 |
|---|---|---|---|
| 🔴 P0 | Cloudflare Rate Limiting 설정 | 30분 | 외부 URL fetch 남용 시 Vercel 함수 비용·시간 직결 |
| 🔴 P0 | Supabase 헬스체크 크론 | 20분 | 7일 비활성 시 프로젝트 자동 정지 → 서비스 전체 다운 |
| 🔴 P0 | Gemini 호출 최소화 설계 | 설계 단계 반영 | 무료 티어 Rate Limit이 가장 먼저 막히는 지점 |
| 🟡 P1 | Vercel 비동기 함수 구조 (10초 타임아웃 대응) | 기능 설계 시 반영 | PageSpeed API 등 느린 외부 호출 대응 |
| 🟡 P1 | Supabase 캐싱 테이블 구축 | 1시간 | 동일 URL 재요청 방지, DB·외부 API 부하 절감 |
| 🟡 P1 | 환경변수 3중 분리 (Prod/Preview/Dev) | 30분 | 키 유출 사고 예방 |
| 🟢 P2 | GitHub Actions CI 구성 | 1시간 | 배포 전 빌드 실패 사전 차단 |
| 🟢 P2 | RLS(Row Level Security) 점검 | 30분 | 익명 사용자 데이터 저장 구조의 보안 |

---

## 1. Cloudflare — Rate Limiting 설정 (P0)

### 목표
`/api/*` 경로, 특히 외부 URL을 fetch하는 SEO·GEO 체커 엔드포인트에 대해 IP당 요청 횟수를 제한한다.

### 구현 지침 (Claude Code용)
- Cloudflare 대시보드 > Security > WAF > Rate limiting rules에서 설정 (코드 변경 불필요, 인프라 설정)
- 규칙 예시: `(http.request.uri.path contains "/api/seo-check")` → IP당 분당 5회 초과 시 429 응답
- **Proxy 모드 확인 필수**: DNS 레코드가 "DNS only(회색 구름)"이 아닌 "Proxied(오렌지 구름)"인지 먼저 확인
- Bot Fight Mode ON (무료 플랜 기본 제공)
- SSL/TLS 모드는 반드시 **Full (Strict)**로 설정 — Vercel과 병행 시 리다이렉트 루프 방지

### 확인 방법
```
curl -I https://nexalab.app/api/seo-check
# Cloudflare 헤더(cf-ray 등)가 응답에 포함되는지 확인
```

---

## 2. Supabase — 헬스체크 크론 (P0)

### 목표
7일간 API 요청이 없을 시 무료 프로젝트가 자동 일시정지되는 것을 방지한다.

### 구현 지침 (Claude Code용)
- GitHub Actions 워크플로우로 매일 1회 Supabase에 가벼운 쿼리를 보내는 스케줄러 구성
- 파일 위치: `.github/workflows/supabase-healthcheck.yml`

```yaml
name: Supabase Health Check
on:
  schedule:
    - cron: '0 0 * * *'  # 매일 00:00 UTC
  workflow_dispatch:  # 수동 실행 버튼도 추가
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -X GET "https://<PROJECT_REF>.supabase.co/rest/v1/" \
          -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

- `SUPABASE_ANON_KEY`는 GitHub Secrets에 등록 (코드에 하드코딩 금지)
- 대안: Vercel Cron Jobs로 동일 기능 구현 가능 (`vercel.json`에 크론 설정 추가)

---

## 3. Supabase — 캐싱 테이블 구축 (P1)

### 목표
동일 URL 24시간 내 재요청 시 외부 fetch 없이 DB에서 즉시 반환하여 부하와 비용을 절감한다.

### 스키마 설계
```sql
create table seo_check_results (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  url_hash text unique not null, -- 결과 공유 URL용 (예: /tools/seo-geo-check/result/[hash])
  seo_score int,
  geo_score int,
  report_json jsonb,
  created_at timestamptz default now()
);
create index idx_url_hash on seo_check_results(url_hash);
create index idx_url on seo_check_results(url);
```

### 캐시 조회 로직 (의사코드)
```
1. 요청 URL을 해시(SHA-256 등)로 변환
2. seo_check_results 테이블에서 url_hash + created_at > (now - 24h) 조회
3. 존재하면 → 캐시된 report_json 즉시 반환 (외부 fetch 스킵)
4. 없으면 → 신규 점검 실행 → 결과 저장 → 반환
```

### RLS 정책 확인 (P2와 연계)
- 익명 사용자가 INSERT는 가능하되 (점검 요청), 타인의 row를 UPDATE/DELETE 하지 못하도록 정책 설정
```sql
alter table seo_check_results enable row level security;

create policy "Allow public insert"
  on seo_check_results for insert
  to anon
  with check (true);

create policy "Allow public read"
  on seo_check_results for select
  to anon
  using (true);
```

---

## 4. Gemini API — 호출 최소화 설계 (P0)

### 원칙
> SEO·GEO 체커 기획서(3-1, 3-2)의 대부분 항목은 **정적 분석(HTML 파싱, 정규식, JSON-LD 파싱)만으로 구현 가능**하며 AI 호출이 불필요하다. AI는 규칙 기반으로 어려운 항목에만 제한적으로 사용한다.

### 항목별 AI 필요 여부 재분류

| 항목 | AI(Gemini) 필요 여부 | 비고 |
|---|---|---|
| title/meta description 길이 체크 | ❌ 불필요 | 정규식/문자열 길이 계산 |
| robots.txt AI 크롤러 체크 | ❌ 불필요 | 텍스트 파싱 |
| llms.txt 존재 여부 | ❌ 불필요 | HTTP 요청 + 존재 확인 |
| JSON-LD 스키마 파싱 | ❌ 불필요 | JSON 파싱 |
| 질문형 헤딩 비율 | ⚠️ 부분 필요 | 1차는 정규식(~하는 방법, ~란 등 패턴 매칭)으로 시도, 애매한 경우만 AI 보조 |
| 본문 요약 품질 평가 | ✅ AI 권장 | 자연어 품질 판단은 규칙 기반 한계 있음 |
| E-E-A-T 신호 텍스트 평가 | ⚠️ 부분 필요 | 저자명/링크 존재는 파싱, 신뢰도 "느낌"은 AI 보조 |

### 구현 지침
- Gemini 호출은 **캐싱된 결과가 없을 때 + 정적 분석으로 판단 불가한 항목에 한해서만** 실행
- 일일 사용량을 Google AI Studio 대시보드에서 주기적으로 확인하는 루틴 필요 (자동화 어려움 — 수동 체크 권장)
- 개인정보처리방침에 "AI 분석 시 Gemini API(무료 티어)를 사용하며, 관련 데이터 처리 정책을 따른다"는 고지 문구 추가 검토

---

## 5. Vercel — 비동기 함수 구조 (P1)

### 문제
Hobby(무료) 플랜은 서버리스 함수 실행시간 10초 제한. PageSpeed Insights API 등 느린 외부 호출 시 타임아웃 위험.

### 구현 지침 (Claude Code용)
- 요청 접수와 처리를 분리하는 구조로 설계:
  1. `/api/seo-check/submit` — URL 접수 → Supabase에 `status: pending` row 생성 → 즉시 응답 반환
  2. 백그라운드에서 실제 점검 로직 실행 (Vercel의 `waitUntil` 또는 별도 큐 방식)
  3. `/api/seo-check/status/[id]` — 프론트에서 폴링하여 완료 여부 확인
- 프론트엔드는 "점검 중..." 로딩 상태를 보여주고 폴링 방식(예: 2초 간격)으로 완료 확인

### 환경변수 분리 체크
- [ ] Production: 운영용 Gemini API 키, Supabase 키
- [ ] Preview: 별도 테스트용 키 (가능하면) 또는 동일 키 + 낮은 쿼터 주의
- [ ] Development: 로컬 `.env.local` (반드시 `.gitignore`에 포함 확인)

---

## 6. GitHub — CI/CD 기초 (P2)

### 구현 지침
- `.github/workflows/ci.yml` 최소 구성:
```yaml
name: CI
on:
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
```
- 브랜치 전략: `main`(운영, Vercel Production 연동) / `dev`(개발, Vercel Preview 연동)
- Secrets 목록 (GitHub repo Settings > Secrets and variables > Actions):
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 절대 프론트 노출 금지)
  - `GEMINI_API_KEY`

---

## 7. SEO·GEO 체커 기능 도입 시 최종 체크리스트

- [ ] Cloudflare Rate Limiting 규칙 설정 완료 (`/api/*` 경로)
- [ ] Cloudflare SSL/TLS 모드 Full(Strict) 확인
- [ ] Supabase 헬스체크 크론 작동 확인 (GitHub Actions 또는 Vercel Cron)
- [ ] Supabase `seo_check_results` 테이블 + RLS 정책 적용
- [ ] Gemini API 호출 지점을 "정적 분석 불가 항목"으로만 제한하는 로직 구현
- [ ] Vercel 함수 10초 타임아웃 대응 (비동기 접수/폴링 구조)
- [ ] 환경변수 Production/Preview/Development 3중 분리 확인
- [ ] GitHub Actions CI 빌드 체크 연동
- [ ] `.env.local`이 `.gitignore`에 포함되어 있는지 재확인
- [ ] 개인정보처리방침에 Gemini API 사용 고지 문구 추가 검토

---

## 8. 참고 — 무료 티어 한계 요약표

| 서비스 | 무료 티어 주요 제약 | 확인 링크 |
|---|---|---|
| Vercel Hobby | 함수 실행 10초, 월 대역폭 100GB | vercel.com/docs/limits |
| Supabase Free | 7일 비활성 시 정지, DB 500MB | supabase.com/pricing |
| Cloudflare Free | Rate Limiting 일부 기능 제한적 제공 | developers.cloudflare.com |
| Gemini API Free | 모델별 분당/일일 요청 수 제한 | ai.google.dev/pricing |

> ⚠️ 위 수치는 서비스 정책 변경이 잦은 영역이라, 실제 구현 직전에 각 서비스 공식 문서에서 최신 쿼터를 재확인하는 것을 권장합니다.
