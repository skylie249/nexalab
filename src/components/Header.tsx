"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useTheme } from "./ThemeProvider";
import styles from "./Header.module.css";

type TrigramPattern = [boolean, boolean, boolean];

function Trigram({ pattern, x, y, rotate }: { pattern: TrigramPattern; x: number; y: number; rotate: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`} fill="#000">
      {pattern.map((solid, i) => {
        const barY = (i - 1) * 0.95 - 0.3;
        return solid ? (
          <rect key={i} x={-1.7} y={barY} width={3.4} height={0.6} />
        ) : (
          <g key={i}>
            <rect x={-1.7} y={barY} width={1.35} height={0.6} />
            <rect x={0.35} y={barY} width={1.35} height={0.6} />
          </g>
        );
      })}
    </g>
  );
}

// 좌우로 펄럭이는 리본 실루엣(상/하단 모서리에 물결 2주기)을 만드는 clipPath 경로
const FLAG_WAVE_D =
  "M0,2.7 C1.67,2.7 3.33,0.3 5,0.3 C6.67,0.3 8.33,2.7 10,2.7 C11.67,2.7 13.33,0.3 15,0.3 " +
  "C16.67,0.3 18.33,2.7 20,2.7 C21.67,2.7 23.33,0.3 25,0.3 C26.67,0.3 28.33,2.7 30,2.7 " +
  "L30,17.3 C28.33,17.3 26.67,19.7 25,19.7 C23.33,19.7 21.67,17.3 20,17.3 C18.33,17.3 16.67,19.7 15,19.7 " +
  "C13.33,19.7 11.67,17.3 10,17.3 C8.33,17.3 6.67,19.7 5,19.7 C3.33,19.7 1.67,17.3 0,17.3 Z";

function FlagShineOverlay({ shineId }: { shineId: string }) {
  return (
    <>
      <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
        <stop offset="16.6%" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="33.3%" stopColor="#000" stopOpacity="0.16" />
        <stop offset="50%" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="66.6%" stopColor="#000" stopOpacity="0.16" />
        <stop offset="83.3%" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
      </linearGradient>
    </>
  );
}

function FlagKR() {
  return (
    <svg viewBox="0 0 30 20" className={styles.flagIcon} aria-hidden="true">
      <defs>
        <clipPath id="kr-wave">
          <path d={FLAG_WAVE_D} />
        </clipPath>
        <FlagShineOverlay shineId="kr-shine" />
      </defs>
      <g clipPath="url(#kr-wave)">
        <rect width="30" height="20" fill="#fff" />
        {/* 태극 문양: 공식 국기 SVG(위키미디어 Flag_of_South_Korea.svg)의 비대칭 원호(R, 3R/4, R/2) 좌표를 r=5 기준으로 축척 변환 */}
        <g transform="translate(15,10) rotate(33.69006752598)">
          <circle r="5" fill="#fff" />
          <path d="M2.5,0 A3.75,3.75 0 1,1 -5,0 A5,5 0 1,1 5,0 Z" fill="#cd2e3a" />
          <path d="M-5,0 A5,5 0 1,0 5,0 A2.5,2.5 0 1,0 0,0 A2.5,2.5 0 1,1 -5,0 Z" fill="#0047a0" />
        </g>
        {/* 건(乾) 상단 좌측 */}
        <Trigram pattern={[true, true, true]} x={8.8} y={5.8} rotate={-33.69006752598} />
        {/* 감(坎) 상단 우측 */}
        <Trigram pattern={[false, true, false]} x={21.2} y={5.8} rotate={56.30993247402} />
        {/* 리(離) 하단 좌측 */}
        <Trigram pattern={[true, false, true]} x={8.8} y={14.2} rotate={56.30993247402} />
        {/* 곤(坤) 하단 우측 */}
        <Trigram pattern={[false, false, false]} x={21.2} y={14.2} rotate={-33.69006752598} />
        <rect width="30" height="20" fill="url(#kr-shine)" style={{ mixBlendMode: "overlay" }} />
      </g>
    </svg>
  );
}

function FlagUS() {
  return (
    <svg viewBox="0 0 30 20" className={styles.flagIcon} aria-hidden="true">
      <defs>
        <clipPath id="us-wave">
          <path d={FLAG_WAVE_D} />
        </clipPath>
        <FlagShineOverlay shineId="us-shine" />
      </defs>
      <g clipPath="url(#us-wave)">
        <rect width="30" height="20" fill="#fff" />
        <g fill="#B22234">
          <rect y="0" width="30" height="1.54" />
          <rect y="3.08" width="30" height="1.54" />
          <rect y="6.15" width="30" height="1.54" />
          <rect y="9.23" width="30" height="1.54" />
          <rect y="12.31" width="30" height="1.54" />
          <rect y="15.38" width="30" height="1.54" />
          <rect y="18.46" width="30" height="1.54" />
        </g>
        <rect width="12" height="10.77" fill="#3C3B6E" />
        <g fill="#fff">
          <circle cx="2" cy="2" r="0.5" />
          <circle cx="6" cy="2" r="0.5" />
          <circle cx="10" cy="2" r="0.5" />
          <circle cx="4" cy="5.4" r="0.5" />
          <circle cx="8" cy="5.4" r="0.5" />
          <circle cx="2" cy="8.8" r="0.5" />
          <circle cx="6" cy="8.8" r="0.5" />
          <circle cx="10" cy="8.8" r="0.5" />
        </g>
        <rect width="30" height="20" fill="url(#us-shine)" style={{ mixBlendMode: "overlay" }} />
      </g>
    </svg>
  );
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = windowHeight > 0 ? totalScroll / windowHeight : 0;
      setScrollProgress(scroll * 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={`${styles.header} glass`}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/" onClick={closeMenu}>
            <span className={styles.brandName}>NexaLab</span>
            <span className={styles.appExt}>.app</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li><Link href="/ai-apps">{t("navAiApps")}</Link></li>
            <li><Link href="/biz">{t("navBiz")}</Link></li>
            <li><Link href="/tools/quote-generator">{t("navQuoteGenerator")}</Link></li>
            <li><Link href="/tools/profit-calculator">{t("navProfitCalculator")}</Link></li>
            <li><Link href="/about">{t("navAbout")}</Link></li>
          </ul>
        </nav>

        <div className={styles.actions1}>
          <button
            className={styles.iconButton}
            onClick={toggleTheme}
            aria-label={t("toggleTheme")}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className={styles.langGroup}>
            <Link
              href={pathname}
              locale="ko"
              className={`${styles.langToggle} ${locale === "ko" ? styles.langActive : ""}`}
              aria-label={t("switchToKo")}
              aria-current={locale === "ko" ? "true" : undefined}
            >
              <FlagKR />
            </Link>
            <Link
              href={pathname}
              locale="en"
              className={`${styles.langToggle} ${locale === "en" ? styles.langActive : ""}`}
              aria-label={t("switchToEn")}
              aria-current={locale === "en" ? "true" : undefined}
            >
              <FlagUS />
            </Link>
          </div>
          <button
            className={`${styles.iconButton} ${styles.menuButton}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={isMenuOpen}
          >
            <span className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerOpen : ""}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <nav className={`${styles.mobileNav} ${isMenuOpen ? styles.mobileNavOpen : ""}`}>
        <ul className={styles.mobileNavList}>
          <li><Link href="/ai-apps" onClick={closeMenu}>{t("navAiApps")}</Link></li>
          <li><Link href="/biz" onClick={closeMenu}>{t("navBiz")}</Link></li>
          <li><Link href="/tools/quote-generator" onClick={closeMenu}>{t("navQuoteGenerator")}</Link></li>
          <li><Link href="/tools/profit-calculator" onClick={closeMenu}>{t("navProfitCalculator")}</Link></li>
          <li><Link href="/about" onClick={closeMenu}>{t("navAbout")}</Link></li>
        </ul>
      </nav>

      <div
        className={styles.progressBar}
        style={{ width: `${scrollProgress}%` }}
      />
    </header>
  );
}
