"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import styles from "./Header.module.css";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
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
            <li><Link href="/ai-apps">AI Apps</Link></li>
            <li><Link href="/biz">Biz</Link></li>
            <li><Link href="/tools/quote-generator">AI 견적서</Link></li>
            <li><Link href="/about">About</Link></li>
          </ul>
        </nav>

        <div className={styles.actions1}>
          <button
            className={styles.iconButton}
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            className={`${styles.iconButton} ${styles.menuButton}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
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
          <li><Link href="/ai-apps" onClick={closeMenu}>AI Apps</Link></li>
          <li><Link href="/biz" onClick={closeMenu}>Biz</Link></li>
          <li><Link href="/tools/quote-generator" onClick={closeMenu}>AI 견적서</Link></li>
          <li><Link href="/about" onClick={closeMenu}>About</Link></li>
        </ul>
      </nav>

      <div
        className={styles.progressBar}
        style={{ width: `${scrollProgress}%` }}
      />
    </header>
  );
}
