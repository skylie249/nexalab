import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "always",
  // 기본값은 secure 속성이 빠져 있어(next-intl 기본: { name: "NEXT_LOCALE", sameSite: "lax" }),
  // HTTPS 연결이 아니어도 쿠키가 전송될 수 있었다. 이 프로젝트는 전 구간 HTTPS라 secure를 명시한다.
  localeCookie: { sameSite: "lax", secure: true },
});

export type Locale = (typeof routing.locales)[number];
