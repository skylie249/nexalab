"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useTheme } from "./ThemeProvider";
import styles from "./Header.module.css";

function FlagKR() {
  return (
    <svg viewBox="0 0 30 20" className={styles.flagIcon} aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      <g transform="translate(15,10) rotate(-33.87)">
        <circle r="5" fill="#fff" />
        <path d="M0,-5 A2.5,2.5 0 0,1 0,0 A2.5,2.5 0 0,0 0,5 A5,5 0 0,0 0,-5 Z" fill="#c60c30" />
        <path d="M0,5 A2.5,2.5 0 0,1 0,0 A2.5,2.5 0 0,0 0,-5 A5,5 0 0,0 0,5 Z" fill="#003478" />
      </g>
    </svg>
  );
}

function FlagUS() {
  return (
    <svg viewBox="0 0 30 20" className={styles.flagIcon} aria-hidden="true">
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
    </svg>
  );
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const otherLocale = locale === "ko" ? "en" : "ko";
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
          <Link
            href={pathname}
            locale={otherLocale}
            className={styles.langToggle}
            aria-label={otherLocale === "en" ? t("switchToEn") : t("switchToKo")}
          >
            {otherLocale === "en" ? <FlagUS /> : <FlagKR />}
          </Link>
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
