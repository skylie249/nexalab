# CLAUDE.md

이 파일은 Claude Code와 함께 진행한 작업 내역을 기록합니다.

## 작업 내역

### 2026-08-13
- `src/app/layout.tsx`에 Google AdSense 스크립트(`adsbygoogle.js`) 추가 (`next/script`, `strategy="afterInteractive"`, `client=ca-pub-7463332684235098`)
- `public/ads.txt` 추가 (AdSense ads.txt 인증용, `pub-7463332684235098`)
- AdSense에서 ads.txt 감지 완료, 사이트 승인 신청 진행함
- 예정: 슬롯 ID 확보 후 `AdSenseMock` 컴포넌트 4곳(`src/components/Sidebar.tsx` 2곳, `src/app/posts/[id]/page.tsx` 2곳)을 실제 `<ins className="adsbygoogle">` 코드로 교체
