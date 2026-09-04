"use client";

import { useTranslations } from "next-intl";
import styles from "../page.module.css";

export default function FpAdvancedToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const t = useTranslations("featureItemGenerator");

  return (
    <>
      <div className={styles.fpToggleRow}>
        <span className={styles.fpToggleLabel}>{t("fpToggleLabel")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          className={`${styles.fpSwitch} ${checked ? styles.fpSwitchActive : ""}`}
          onClick={() => onChange(!checked)}
        >
          <span className={styles.fpSwitchKnob} />
        </button>
      </div>
      {checked && <p className={styles.fpNotice}>{t("fpNotice")}</p>}
    </>
  );
}
