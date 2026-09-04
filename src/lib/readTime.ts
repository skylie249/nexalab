// 한국어 위주 콘텐츠 기준 분당 읽기 속도(글자 수) — 마크다운 문법 제거 후 순수 텍스트 길이로 계산
const CHARS_PER_MINUTE = 500;

export function calculateReadTimeMinutes(content: string): number {
  const plainText = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_>~-]/g, "")
    .replace(/\s+/g, "");

  return Math.max(1, Math.round(plainText.length / CHARS_PER_MINUTE));
}
