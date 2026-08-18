export function formatWon(amount: number, locale: string) {
  const rounded = Math.round(amount);
  if (locale === "en") {
    return `₩${rounded.toLocaleString("en-US")}`;
  }
  return `${rounded.toLocaleString("ko-KR")}원`;
}
