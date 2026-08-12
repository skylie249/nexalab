"use client";

import { useEffect, useState } from "react";
import styles from "./TableOfContents.module.css";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TOCProps {
  items: TOCItem[];
}

export default function TableOfContents({ items }: TOCProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <nav className={styles.toc}>
      <h3 className={styles.title}>목차</h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <li 
            key={item.id} 
            className={`${styles.item} ${styles[`level${item.level}`]} ${activeId === item.id ? styles.active : ''}`}
          >
            <a href={`#${item.id}`} onClick={(e) => handleClick(e, item.id)}>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
