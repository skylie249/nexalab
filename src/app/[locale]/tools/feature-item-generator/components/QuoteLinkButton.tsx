"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "../page.module.css";

export default function QuoteLinkButton({ featureNames }: { featureNames: string[] }) {
  const t = useTranslations("featureItemGenerator");

  // 견적서 생성기 쪽 `features` 쿼리 파라미터 pre-fill 처리는 별도 후속 작업(TODO) —
  // 이번 MVP 범위는 딥링크 전달까지만 구현한다.
  const href = `/tools/quote-generator?from=feature-generator&features=${encodeURIComponent(
    JSON.stringify(featureNames)
  )}`;

  return (
    <Link
      href={href}
      className={styles.primaryButton}
      onClick={() =>
        window.gtag?.("event", "feature_to_quote_click", {
          feature_count: featureNames.length,
        })
      }
    >
      {t("resultQuoteLinkCta")}
    </Link>
  );
}
