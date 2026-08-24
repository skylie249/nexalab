import { Link } from "@/i18n/navigation";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.brand}>
            <span className={styles.brandName}>NexaLab.app</span> - Next-Gen Tech & Business Lab
          </div>
          <div className={styles.links}>
            <Link href="/about">About NexaLab</Link>
            <span className={styles.divider}>|</span>
            <Link href="/privacy">Privacy Policy</Link>
            <span className={styles.divider}>|</span>
            <Link href="mailto:kimhg249@gmail.com">Contact</Link>
          </div>
        </div>
        <div className={styles.bottomSection}>
          <p>Copyright © {currentYear} NexaLab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
