// 최소 서비스워커: 오프라인 시 내비게이션 요청에 대해서만 대체 페이지를 보여준다.
// 블로그 글/AI 도구 결과는 자주 바뀌므로 페이지·API 응답은 캐싱하지 않음(항상 네트워크 우선).
// CACHE_NAME의 버전 부분은 scripts/generate-sw.mjs가 빌드마다 자동으로 덮어쓴다(커밋 해시 기반) —
// 브라우저는 sw.js를 바이트 단위로 비교해 업데이트 여부를 판단하므로, 버전 문자열이 매 배포마다
// 바뀌어야 새 서비스워커가 확실히 감지·설치된다. 로컬에서 이 파일을 직접 열어봤을 때 아래 값이
// 최신 커밋과 다르게 보여도 정상 — 다음 빌드(`npm run build`) 때 자동으로 다시 갱신된다.
const CACHE_NAME = "nexalab-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});
