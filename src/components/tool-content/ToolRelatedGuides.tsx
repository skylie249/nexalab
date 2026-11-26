import { Link } from "@/i18n/navigation";
import styles from "./ToolContent.module.css";

export interface RelatedGuideLink {
  label: string;
  href: string;
}

// "관련 가이드 2~3편" — 가이드 글이 아직 없는 동안은 카테고리 인덱스로 연결해 두고,
// 실제 글이 쌓이면 구체적인 글 링크로 교체한다(각 도구 page.tsx 주석 참고).
export default function ToolRelatedGuides({ title, links }: { title: string; links: RelatedGuideLink[] }) {
  return (
    <section className={`${styles.section} glass`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.relatedList}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={styles.relatedLink}>
            {link.label} →
          </Link>
        ))}
      </div>
    </section>
  );
}
