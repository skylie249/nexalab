import { Link } from "@/i18n/navigation";
import styles from "./HubToolGrid.module.css";

export interface HubToolCardData {
  href: string;
  emoji: string;
  title: string;
  description: string;
  isNew?: boolean;
  isFlagship?: boolean;
}

export default function HubToolGrid({ tools, linkLabel }: { tools: HubToolCardData[]; linkLabel: string }) {
  return (
    <div className={styles.grid}>
      {tools.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className={`${styles.card} glass ${tool.isFlagship ? styles.flagship : ""}`}
        >
          <span className={styles.emoji} aria-hidden="true">
            {tool.emoji}
          </span>
          <div className={styles.cardBody}>
            <span className={styles.cardTitleRow}>
              <span className={styles.cardTitle}>{tool.title}</span>
              {tool.isFlagship && <span className={styles.flagshipBadge}>⭐</span>}
              {tool.isNew && <span className={styles.newBadge}>NEW</span>}
            </span>
            <p className={styles.cardDesc}>{tool.description}</p>
          </div>
          <span className={styles.cardLink}>{linkLabel}</span>
        </Link>
      ))}
    </div>
  );
}
