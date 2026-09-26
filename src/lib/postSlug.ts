// 글 URL은 /[locale]/posts/[slug]. 예전 UUID URL(/posts/<uuid>)은 slug URL로 영구 리다이렉트한다
// (배포 시점에 있던 글은 next.config.mjs의 301, 그 이후 글은 글 상세 페이지의 permanentRedirect).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// Repo A가 만든 한글 slug는 라우트 파라미터로 퍼센트 인코딩된 채 들어올 수 있어 DB 값과 맞추려고 디코딩
export function decodeSlugParam(param: string): string {
  if (!param.includes("%")) return param;
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

export function postPath(slug: string): string {
  return `/posts/${slug}`;
}
