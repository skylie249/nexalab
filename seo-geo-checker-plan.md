# [기능 기획서] URL 하나로 끝내는 SEO·GEO 무료 점검 도구

**작성일**: 2026-08-18
**대상 서비스**: nexalab.app 블로그 내 유틸 기능
**작성 목적**: 방문자가 자기 사이트 URL만 입력하면 SEO(검색엔진 최적화)와 GEO(생성형 검색엔진 최적화) 점검 결과를 즉시 받아볼 수 있는 무료 진단 도구 기획

---

## 1. 한 줄 정의

"내 사이트, ChatGPT랑 구글이 좋아할까?" — URL 하나만 넣으면 전통 SEO 40여 개 항목 + AI 검색엔진(GEO) 준비도를 동시에 점수로 보여주고, 항목별 개선 가이드까지 제공하는 무료 진단 위젯이에요.

nexalab.app에는 이미 **AI 견적서 생성기**, **손익 계산기** 같은 실무형 유틸이 있는데, 이번 기능은 "AI를 다루는 개발자·마케터 블로그"라는 브랜드 정체성과도 잘 맞고, 방문자를 반복 유입시키는 훅(hook) 역할을 할 수 있어요.

---

## 2. 왜 지금 이 기능인가 (시장 배경)

2025년 이후 검색 트래픽의 축이 "구글 10개 링크"에서 "ChatGPT·Perplexity·구글 AI Overview가 요약해주는 답변"으로 급격히 옮겨가고 있어요. 그래서 기존 SEO 점검 도구만으로는 부족하고, "AI가 내 콘텐츠를 인용하는가"를 보는 GEO(Generative Engine Optimization) 점검 수요가 새로 생기고 있어요.

### 경쟁 도구 벤치마크

| 카테고리 | 대표 서비스 | 강점 | 약점(우리의 기회) |
|---|---|---|---|
| 전통 SEO 무료 체커 | Ubersuggest, SEO Site Checkup, Screaming Frog(무료 500URL) | 메타태그·속도·백링크 등 항목이 풍부함 | 대부분 영문 위주 UX, 국내 이용자 눈높이 설명 부족, 결과가 전문 용어투성이 |
| SEO 유료 SaaS | Semrush, Ahrefs, Moz | 데이터 정확도·경쟁사 분석 깊이 최고 | 월 10만원 이상, 진입장벽 높음 → 1인 사업자에겐 과함 |
| AI 가시성 체커(GEO 전문) | Ahrefs AI Visibility Checker, Semrush AI Search Visibility Checker, search-visibility.ai, Mentionable | "브랜드명이 ChatGPT 답변에 뜨는지"를 실시간 질의해서 확인 | 브랜드/키워드 입력이 필요해 설정이 번거롭고, 대부분 회원가입 유도형 |
| 워드프레스 플러그인형 | AIOSEO, MonsterInsights | 사이트 내 자동 진단 | 워드프레스 전용이라 범용 URL 체크 불가 |

**우리의 차별화 포인트**: 회원가입 없이 URL만 넣으면 (1) SEO 기술 점검 + (2) "정적 분석 기반 GEO 준비도" 를 **하나의 리포트**로 동시에 보여주는 도구는 아직 국내에 흔치 않아요. 특히 아래 3번 항목의 **AI 크롤러 접근 허용 여부 체크**는 구현 난이도는 낮은데 국내에서 다루는 도구가 거의 없어서 좋은 차별화 포인트가 될 수 있어요.

---

## 3. 점검 항목 설계

크게 "SEO 기본 점검"과 "GEO 준비도 점검" 두 축으로 나누고, 각 항목마다 자동으로 추출 가능한 데이터 소스를 명시했어요. (※ GEO는 "AI가 실제로 인용했는가"를 실시간으로 확인하는 게 아니라, "AI가 인용하기 쉬운 구조인가"를 정적으로 진단하는 **준비도 점수** 개념으로 설계하는 게 기술적으로 가장 현실적이에요. 실시간 AI 질의 방식은 뒤에 4번 확장 로드맵에서 다뤄요.)

### 3-1. SEO 점검 항목

| 카테고리 | 점검 항목 | 데이터 소스 | 구현 난이도 |
|---|---|---|---|
| 메타데이터 | title 길이(30~60자), meta description 길이(70~160자), 중복 여부 | HTML `<head>` 파싱 | 하 |
| 인덱싱 | robots.txt 존재/차단 여부, sitemap.xml 존재 여부, canonical 태그 | robots.txt·sitemap.xml 직접 요청 | 하 |
| 구조 | H1 개수(1개 권장), 헤딩 계층 정합성, alt 텍스트 누락 이미지 비율 | HTML 파싱 | 하 |
| 소셜/공유 | Open Graph, Twitter Card 태그 존재 여부 | HTML `<head>` 파싱 | 하 |
| 성능 | Core Web Vitals(LCP·CLS·INP), 모바일 친화성 | Google PageSpeed Insights API(무료, API 키 필요) | 중 |
| 보안 | HTTPS 적용 여부, 혼합 콘텐츠(mixed content) | 응답 헤더·리소스 스캔 | 하 |
| 구조화 데이터 | JSON-LD 존재 여부, 스키마 타입(Article·Product·FAQ 등) | HTML 내 `<script type="application/ld+json">` 파싱 | 중 |

### 3-2. GEO 점검 항목 (신규 설계)

| 카테고리 | 점검 항목 | 데이터 소스 | 구현 난이도 |
|---|---|---|---|
| AI 크롤러 접근성 ★차별화 | robots.txt에서 GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot 허용/차단 여부 | robots.txt 파싱 | 하 |
| llms.txt | 루트에 llms.txt 존재 여부, 형식 적합성(H1+요약+링크 구조) | `/llms.txt` 직접 요청 | 하 |
| 인용 친화 구조화 | FAQPage, HowTo, Article 스키마 존재 여부 | JSON-LD 파싱 | 중 |
| 답변형 콘텐츠 구조 | 헤딩이 질문형("~하는 방법", "~란?")인 비율, 본문 상단 200단어 내 핵심 요약 존재 여부 | 텍스트 분석(정규식/간단 NLP) | 중 |
| E-E-A-T 신호 | 저자명·프로필 링크 존재 여부, 최종 수정일(updated) 메타 존재 여부 | HTML 파싱 + schema Person/Author | 중 |
| 신뢰성 신호 | 외부 출처 링크 개수, 통계·수치 데이터 언급 여부 | 텍스트·링크 분석 | 중 |

### 3-3. 점수 산출 방식(예시)

- SEO 점수(100점)와 GEO 점수(100점)를 분리 표기 + 통합 등급(A~D) 제공
- 카테고리별 가중치 예시: 메타데이터 15%, 인덱싱 15%, 구조 15%, 성능 20%, 구조화 데이터 15%, 보안 10%, 소셜 10% (SEO 기준)
- GEO는 AI 크롤러 접근성·llms.txt·구조화 데이터에 가중치를 더 둬서 "실질적으로 AI가 읽고 인용할 수 있는가"를 핵심 지표로 삼는 걸 추천해요

---

## 4. 리포트 UX 예시

```
🔍 example.com 점검 결과

[ SEO 점수: 78/100 (B) ]   [ GEO 점수: 42/100 (D) ]

✅ 통과 (12)          ⚠️ 개선 필요 (5)         ❌ 실패 (3)

❌ GPTBot이 robots.txt에서 차단되어 있어요
   → AI 검색엔진이 이 사이트를 아예 읽지 못해요.
   → [해결 방법 보기] robots.txt에 "User-agent: GPTBot / Allow: /" 추가

⚠️ FAQ 스키마가 없어요
   → AI 답변에 인용되려면 질문-답변 형식의 구조화 데이터가 유리해요.
   → [해결 방법 보기] FAQPage 스키마 예시 코드 제공

✅ HTTPS 적용됨 / ✅ title 길이 적정 / ...
```

- 항목별로 "왜 중요한지 한 줄 설명 + 바로 복붙 가능한 해결 코드"를 붙이면, 방문자가 "아, 이거 우리 개발자한테 보여줘야겠다" 하고 링크를 공유하게 만들 수 있어요 (자연 확산 포인트).
- 결과 페이지 URL을 고유하게 생성(`/tools/seo-geo-check/result/[해시]`)해서 카카오톡·슬랙 공유가 쉽게 되도록 설계하는 걸 추천해요.

---

## 5. 기술 구현 방향 (MVP → 확장)

nexalab.app이 Next.js 기반으로 추정되는 만큼, 아래 구성이 가장 자연스러워요.

| 단계 | 범위 | 핵심 기술 |
|---|---|---|
| **MVP (1~2주)** | 3-1의 하 난이도 항목 + 3-2의 AI 크롤러 접근성·llms.txt 체크 | Next.js API Route + `cheerio`(HTML 파싱) + `fetch`로 robots.txt/sitemap/llms.txt 직접 요청. 서버리스 함수(Vercel Functions)로 충분히 처리 가능 |
| **v1.1** | Core Web Vitals 연동 | Google PageSpeed Insights API(무료, 일일 쿼터 있음 → 캐싱 필수) |
| **v1.2** | 구조화 데이터·헤딩 분석 자동화 | JSON-LD 파서 + 간단 정규식 기반 텍스트 분석 |
| **v2 (확장)** | 실제 AI 질의 기반 "우리 브랜드가 ChatGPT/Perplexity 답변에 뜨는가" 체크 | OpenAI/Anthropic/Perplexity API 호출 → 비용 발생 구간이라 유료 기능으로 설계 추천 |

### 유의할 기술적 제약

- **크롤링 부하**: 동일 URL 반복 요청을 막기 위해 결과를 24시간 캐싱하고, IP당 요청 횟수를 제한(예: 1일 5회)하는 게 안정성과 비용 관리에 필요해요.
- **CORS/차단 사이트**: 일부 사이트는 서버 간 요청(server-to-server fetch) 자체를 막아둔 경우가 있어서, 실패 시 "이 사이트는 자동 점검이 제한돼요"라는 안내와 수동 체크리스트를 대안으로 보여주는 게 좋아요.
- **PageSpeed API 쿼터**: 무료지만 일일 요청 제한이 있어서, 트래픽이 늘면 API 키 여러 개 로테이션 또는 유료 등급으로 넘어가는 걸 미리 고려해두세요.
- **정확도 고지**: GEO 항목은 아직 업계 표준 채점 기준이 없는 신생 영역이라, 리포트 하단에 "참고용 준비도 점수이며 실제 AI 인용 여부를 보장하지 않는다"는 문구를 넣어 신뢰도 관리와 법적 리스크를 함께 낮추는 걸 추천해요.

---

## 6. 수익화 전략

| 전략 | 실행 방법 | 기대 효과 |
|---|---|---|
| 리드 매그넷 → 이메일 리스트 구축 | 무료 결과는 요약만 보여주고, "상세 PDF 리포트"는 이메일 입력 시 발송 | 뉴스레터·향후 유료 서비스(컨설팅, 견적서 생성기 등) 교차 프로모션 자산 확보 |
| AdSense 배치 | 리포트 로딩 중 대기 화면, 결과 페이지 하단에 광고 배치 | 이미 블로그에 AdSense 적용 중이므로 추가 개발 비용 거의 없음 |
| 제휴 마케팅(Affiliate) | "성능 개선 필요" 항목 옆에 호스팅사·CDN·이미지 최적화 툴 제휴 링크 삽입 | 클릭당/전환당 수익, 사용자에게도 실질적 도움 제공 |
| 프리미엄 등급 | 월 구독 시: 정기 모니터링(주간 리포트 이메일), 경쟁사 URL 비교, GEO v2(실제 AI 질의 체크) | 반복 수익(recurring revenue) 모델로 전환 |
| 바이럴 확산 | 결과 리포트를 고유 URL로 생성해 SNS 공유 유도, "우리 팀 개발자에게 보내보세요" CTA | 별도 광고비 없이 자연 유입 확대 |

---

## 7. 로드맵 제안

| 단계 | 기간(예상) | 목표 |
|---|---|---|
| 1단계: MVP 출시 | 1~2주 | SEO 기본 항목 + AI 크롤러 접근성·llms.txt 체크만으로 우선 공개, 사용자 반응 확인 |
| 2단계: 리포트 고도화 | 2~4주차 | PageSpeed 연동, 구조화 데이터 분석, 공유용 결과 페이지 |
| 3단계: 리드젠·수익화 연결 | 4~6주차 | 이메일 게이트, AdSense·제휴 링크 삽입, 사용량 제한 로직 |
| 4단계: GEO v2 (실시간 AI 질의) | 이후 확장 | 유료 등급으로 설계, ChatGPT/Perplexity API 연동한 실제 인용 여부 체크 |

---

## 8. 다음 액션 아이템

- [ ] MVP 점검 항목 최종 확정 (3-1, 3-2 표 중 우선순위 태깅)
- [ ] robots.txt AI 크롤러 체크 로직 프로토타입 제작 (가장 쉽고 차별화 큰 항목이라 우선 추천)
- [ ] PageSpeed Insights API 키 발급 및 쿼터 확인
- [ ] 결과 리포트 UI 와이어프레임 제작
- [ ] 이메일 게이트/캐싱/요청 제한 정책 확정

---

### 참고 자료

- [Best SEO Checker and Website Analyzer Tools Compared 2026 – WPBeginner](https://www.wpbeginner.com/showcase/best-seo-checker-and-website-analyzer-tools/)
- [Generative Engine Optimization (GEO): The Complete 2026 Guide – Enrich Labs](https://www.enrichlabs.ai/blog/generative-engine-optimization-geo-complete-guide-2026)
- [llms.txt: The Complete Guide to the AI Crawler Standard (2026) – GrowthGPT](https://thegrowthgpt.com/resources/blogs/llms-txt-ai-crawler-guide)
- [Free AI Visibility Checker – Ahrefs](https://ahrefs.com/ai-visibility-checker)
- [Free AI Visibility Tool – Semrush](https://www.semrush.com/free-tools/ai-search-visibility-checker/)
- [Get Started with the PageSpeed Insights API – Google for Developers](https://developers.google.com/speed/docs/insights/v5/get-started)
