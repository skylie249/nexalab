# CLAUDE.md — nexalab.app

이 저장소는 nexalab.app(Next.js App Router, Vercel 배포, Cloudflare DNS, Supabase)이다.
현재 최우선 목표는 **Google AdSense 승인**이다. 이전 심사에서 '가치가 낮은 콘텐츠' 사유로 여러 번 거절됐다.
아래 결정 사항을 어기는 변경은 하지 말고, 필요하면 먼저 물어본다.

## 사이트 방향 (확정)

- 새 도메인을 쓰지 않고 nexalab.app을 고쳐서 재신청한다. 애드센스는 루트 도메인 단위로 승인하므로 서브도메인 프로젝트도 이 승인이 있어야 한다.
- 사이트 주제는 **웹사이트 운영·진단 실무 가이드** 하나다.
- 가이드 카테고리는 4개다. slug는 아래를 쓴다.
  - `seo-geo` — SEO·GEO
  - `security` — 웹 보안
  - `performance-a11y` — 성능·접근성
  - `adsense-ops` — 애드센스·사이트 운영
- 언어는 **한국어만** 쓴다. 영문판(`/en`)은 없앤다.

## URL·라우팅 규칙

- 가이드 URL: `/ko/guides`, `/ko/guides/[category]`, `/ko/guides/[category]/[slug]`
- `/en/*`는 같은 경로의 `/ko/*`로 **301** 리다이렉트한다 (`next.config` redirects 또는 미들웨어).
- hreflang 태그, 사이트맵의 `/en` 항목, 언어 전환 버튼은 제거한다. 새 코드에 `/en`이나 다국어 분기를 추가하지 않는다.
- `/ai-apps`, `/biz`는 내용을 About으로 합치고 원래 URL은 About으로 301 리다이렉트한다.
- `/ko` 접두사를 없애는 작업은 **승인 이후**로 미뤘다. 지금은 하지 않는다.

## 렌더링

- 가이드와 개발 기록 페이지는 반드시 **SSG 또는 ISR**로 만든다. 본문이 서버 HTML에 들어 있어야 한다.
- 본문을 클라이언트에서 fetch해서 그리는 방식은 쓰지 않는다. 크롤러가 본문을 못 읽으면 '콘텐츠 없음'으로 판정된다.
- 가이드 글에는 Article 구조화 데이터(JSON-LD), 작성자, 작성일·수정일을 넣는다.

## 데이터

- 글은 기존 글 작성 기능(관리자 로그인 + 글 CRUD, Supabase)을 그대로 쓴다.
- 글 테이블에 `category`(위 slug 중 하나)와 `type`(`guide` | `log`) 필드를 추가한다.
- 기존 빌드로그(`/history/*`)는 `type = log`로 두고, 메뉴 이름은 '개발 기록'으로 바꾼다.
- Supabase는 RLS를 켠 상태를 유지한다. 서버 전용 키(service_role)는 클라이언트 번들에 들어가면 안 된다.

## 메뉴·홈

- 메인 메뉴: 가이드(카테고리 4개) · 진단 도구 · 개발 기록 · About
- 홈 상단에는 견적 배너 대신 최신 가이드 글과 대표 진단 도구를 보여 준다.

## 도구 페이지

- **noindex + 사이트맵 제외 + '기타 도구' 하위 메뉴로 이동**: 견적서 생성기(`quote-generator`), 손익 계산기(`profit-calculator`), 제안서(`proposal`), 업무 유틸(`business-utility`)
  - 기능 항목 생성기(`feature-item-generator`)도 이 목록에 넣을지는 미정이다. 결정되기 전에는 건드리지 않는다.
- **설명 보강 대상**(색인 유지): `seo-geo-checker`, `llms-txt-generator`, `report-checker`, `adsense-precheck`, `security-check`, `site-check`, `site-check/all-in-one`
  - 도구 아래에 1,000~1,500자 설명을 붙인다: 무엇을 점검하는지 → 결과 읽는 법 → 자주 나오는 문제와 해결법 → FAQ → 관련 가이드 2~3편 링크.
  - 설명 텍스트도 서버 HTML에 들어 있어야 한다.

## 글 작성 기준 (글 초안을 도울 때)

- 한국어, 편당 2,000자 이상.
- 일반론보다 직접 겪은 사례, 수치, 실패담 위주로 쓴다. 저자가 넣을 스크린샷이나 nexalab 도구 진단 결과 자리를 표시해 둔다.
- 글마다 관련 nexalab 도구 링크와 같은 카테고리 글 링크를 각각 2개 이상 넣는다.
- 글을 자동 생성해서 그대로 발행하는 파이프라인은 만들지 않는다. 초안은 항상 사람이 다듬은 뒤 발행한다.

## 재신청 기준

다음을 모두 채우기 전에는 재신청하지 않는다.

1. 가이드 글 20편 이상 (편당 2,000자 이상, 직접 찍은 자료 포함)
2. 설명 보강 대상 도구 페이지 작업 완료
3. Search Console에서 가이드 글의 80% 이상이 '색인 생성됨'
4. 마지막 글 발행 후 2주 이상 지남
5. nexalab 애드센스 사전 점검기로 사이트 전체 점검 통과
6. `/en` 301, noindex, 사이트맵, 깨진 링크 0 재확인

## 승인 이후로 미룬 일

- noindex 걸어 둔 도구 다시 풀기
- `/ko` 접두사 제거와 루트 URL 이전
- 해외 트래픽용 서브도메인 프로젝트(미국 급여 계산기 등)

## 작업 후 확인

- `curl -I https://www.nexalab.app/en/tools/security-check` → 301, Location이 `/ko/...`인지
- 수정한 페이지의 HTML 소스에 본문 텍스트가 있는지
- `sitemap.xml`에 `/en`과 noindex 페이지가 없는지
