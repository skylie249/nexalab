import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import AdSenseMock from "./AdSenseMock";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isPostDetail = false }: { isPostDetail?: boolean }) {
  const t = useTranslations("sidebar");

  return (
    <aside className={styles.sidebar}>
      {/* 1. Profile Card */}
      <div className={`${styles.widget} glass`}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>👤</div>
          <div>
            <h3 className={styles.profileName}>Kim Ho-gyun</h3>
            <p className={styles.profileRole}>{t("role")}</p>
          </div>
        </div>
        <p className={styles.profileQuote}>{t("quote")}</p>
        <div className={styles.profileLinks}>
          <Link href="https://github.com/skylie249/" target="_blank" rel="noopener noreferrer">GitHub</Link>
          <Link href="https://www.linkedin.com/in/nexalab0812" target="_blank" rel="noopener noreferrer">LinkedIn</Link>
          <Link href="mailto:kimhg249@gmail.com">Contact</Link>
        </div>
      </div>

      {/* 2. AdSense Display Ad */}
      {!isPostDetail ? (
        <AdSenseMock id="Ad #1" type="Square Banner" width="300px" height="250px" />
      ) : (
        <div className={styles.stickyAd}>
          <AdSenseMock id="Ad #2" type="Sidebar Sticky Banner" width="300px" height="600px" />
        </div>
      )}
    </aside>
  );
}
