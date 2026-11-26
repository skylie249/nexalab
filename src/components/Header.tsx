"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useTheme } from "./ThemeProvider";
import styles from "./Header.module.css";

// 애드센스 재신청 구조 개편(2026-11-26): 메인 메뉴를 가이드·진단 도구·개발 기록·About 4개로 고정.
// "진단 도구" 드롭다운은 noindex 대상이 아닌(= 색인 유지) 도구만 상단에 노출하고, noindex 처리된
// 4개(견적서/손익계산기/제안서/업무유틸)는 구분선 아래 "기타 도구"로 묶어 내려보낸다.
// report-checker는 business-utility 허브(noindex) 안에 있지만 그 글 자체는 색인 대상이라
// 허브를 거치지 않고 바로 찾을 수 있도록 상단에 직접 링크를 승격해 둔다.
const DIAGNOSTIC_TOOLS = [
  { href: "/tools/site-check", titleKey: "navSiteCheckHub", descKey: "aiToolsSiteCheckHubDesc" },
  { href: "/tools/report-checker", titleKey: "navReportChecker", descKey: "aiToolsReportDesc" },
  { href: "/tools/site-check/all-in-one", titleKey: "navAllInOneCheck", descKey: "aiToolsAllInOneDesc" },
] as const;

const OTHER_TOOLS = [
  { href: "/tools/quote-generator", titleKey: "navQuoteGenerator", descKey: "aiToolsQuoteDesc" },
  { href: "/tools/profit-calculator", titleKey: "navProfitCalculator", descKey: "aiToolsProfitDesc" },
  { href: "/tools/proposal", titleKey: "navProposalHub", descKey: "aiToolsProposalHubDesc" },
  { href: "/tools/business-utility", titleKey: "navBusinessUtilityHub", descKey: "aiToolsBusinessUtilityHubDesc" },
] as const;

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("header");
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isToolsAccordionOpen, setIsToolsAccordionOpen] = useState(false);
  const toolsDropdownRef = useRef<HTMLLIElement>(null);

  // 렌더 중 이전 값과 비교해 상태를 조정하는 React 권장 패턴(effect+setState 대신) —
  // 메뉴가 닫히면 아코디언도 함께 접는다.
  const [prevIsMenuOpen, setPrevIsMenuOpen] = useState(isMenuOpen);
  if (isMenuOpen !== prevIsMenuOpen) {
    setPrevIsMenuOpen(isMenuOpen);
    if (!isMenuOpen) {
      setIsToolsAccordionOpen(false);
    }
  }

  // 페이지 이동 시 드롭다운을 닫는다(위와 동일한 패턴).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsToolsOpen(false);
  }

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

  useEffect(() => {
    if (!isToolsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isToolsOpen]);

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
            <li><Link href="/guides">{t("navGuides")}</Link></li>
            <li className={styles.dropdownItem} ref={toolsDropdownRef}>
              <button
                type="button"
                className={styles.dropdownTrigger}
                onClick={() => setIsToolsOpen((prev) => !prev)}
                aria-expanded={isToolsOpen}
              >
                {t("navDiagTools")}
              </button>
              <div className={`${styles.dropdownPanel} ${isToolsOpen ? styles.dropdownPanelOpen : ""}`}>
                {DIAGNOSTIC_TOOLS.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={styles.dropdownLink}
                    onClick={() => setIsToolsOpen(false)}
                  >
                    <span className={styles.dropdownLinkTitle}>{t(tool.titleKey)}</span>
                    <span className={styles.dropdownLinkDesc}>{t(tool.descKey)}</span>
                  </Link>
                ))}
                <div className={styles.dropdownDivider} role="separator">
                  <span>{t("navOtherTools")}</span>
                </div>
                {OTHER_TOOLS.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={styles.dropdownLink}
                    onClick={() => setIsToolsOpen(false)}
                  >
                    <span className={styles.dropdownLinkTitle}>{t(tool.titleKey)}</span>
                    <span className={styles.dropdownLinkDesc}>{t(tool.descKey)}</span>
                  </Link>
                ))}
              </div>
            </li>
            <li><Link href="/history">{t("navHistory")}</Link></li>
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
          <li><Link href="/guides" onClick={closeMenu}>{t("navGuides")}</Link></li>
          <li className={styles.mobileAccordionItem}>
            <button
              type="button"
              className={styles.mobileAccordionTrigger}
              onClick={() => setIsToolsAccordionOpen((prev) => !prev)}
              aria-expanded={isToolsAccordionOpen}
            >
              {t("navDiagTools")}
              <span className={`${styles.accordionChevron} ${isToolsAccordionOpen ? styles.accordionChevronOpen : ""}`}>▾</span>
            </button>
            <ul className={`${styles.mobileAccordionPanel} ${isToolsAccordionOpen ? styles.mobileAccordionPanelOpen : ""}`}>
              {DIAGNOSTIC_TOOLS.map((tool) => (
                <li key={tool.href}>
                  <Link href={tool.href} className={styles.mobileAccordionLink} onClick={closeMenu}>
                    <span className={styles.dropdownLinkTitle}>{t(tool.titleKey)}</span>
                    <span className={styles.dropdownLinkDesc}>{t(tool.descKey)}</span>
                  </Link>
                </li>
              ))}
              <li className={styles.dropdownDivider} role="separator">
                <span>{t("navOtherTools")}</span>
              </li>
              {OTHER_TOOLS.map((tool) => (
                <li key={tool.href}>
                  <Link href={tool.href} className={styles.mobileAccordionLink} onClick={closeMenu}>
                    <span className={styles.dropdownLinkTitle}>{t(tool.titleKey)}</span>
                    <span className={styles.dropdownLinkDesc}>{t(tool.descKey)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li><Link href="/history" onClick={closeMenu}>{t("navHistory")}</Link></li>
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
