import styles from "./AdSenseMock.module.css";

interface AdSenseMockProps {
  id: string;
  width?: string;
  height?: string;
  type: string; // 'Horizontal', 'Square', 'Vertical', 'In-article', 'Multiplex'
}

export default function AdSenseMock({ id, width = "100%", height = "100px", type }: AdSenseMockProps) {
  return (
    <div className={styles.adWrapper} style={{ width, minHeight: height }}>
      <div className={styles.adLabel}>Ad</div>
      <div className={styles.adContent}>
        <strong>Google AdSense Banner</strong>
        <span>[{id}] {type}</span>
        {width !== "100%" && <span>({width} x {height})</span>}
      </div>
    </div>
  );
}
