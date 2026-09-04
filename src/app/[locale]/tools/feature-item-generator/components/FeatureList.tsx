"use client";

import { useTranslations } from "next-intl";
import styles from "../page.module.css";

export interface FpDetail {
  type: "EI" | "EO" | "EQ" | "ILF" | "EIF";
  complexity: "저" | "중" | "고";
  points: number;
}

export interface FeatureItem {
  name: string;
  priority: "MVP" | "Nice-to-have";
  difficulty: "상" | "중" | "하";
  description: string;
  fp?: FpDetail | null;
}

export interface FeatureCategory {
  categoryName: string;
  features: FeatureItem[];
}

function difficultyBadgeClass(difficulty: FeatureItem["difficulty"]): string {
  if (difficulty === "상") return styles.badgeDifficultyHigh;
  if (difficulty === "중") return styles.badgeDifficultyMid;
  return styles.badgeDifficultyLow;
}

export default function FeatureList({
  categories,
  showFp,
}: {
  categories: FeatureCategory[];
  showFp: boolean;
}) {
  const t = useTranslations("featureItemGenerator");

  return (
    <div className={styles.categoryList}>
      {categories.map((category) => (
        <div key={category.categoryName} className={`${styles.categoryCard} glass`}>
          <h3 className={styles.categoryTitle}>{category.categoryName}</h3>
          <div className={styles.featureGrid}>
            {category.features.map((feature) => (
              <div key={feature.name} className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <span className={styles.featureName}>{feature.name}</span>
                  <span className={styles.badgeGroup}>
                    <span
                      className={`${styles.badge} ${
                        feature.priority === "MVP" ? styles.badgeMvp : styles.badgeNiceToHave
                      }`}
                    >
                      {feature.priority === "MVP" ? t("priorityMvp") : t("priorityNiceToHave")}
                    </span>
                    <span className={`${styles.badge} ${difficultyBadgeClass(feature.difficulty)}`}>
                      {t("difficultyLabel", { level: feature.difficulty })}
                    </span>
                  </span>
                </div>
                <p className={styles.featureDesc}>{feature.description}</p>
                {showFp && feature.fp && (
                  <div className={styles.fpDetail}>
                    <span>
                      {t("fpTypeLabel")}: <strong>{feature.fp.type}</strong>
                    </span>
                    <span>
                      {t("fpComplexityLabel")}: <strong>{feature.fp.complexity}</strong>
                    </span>
                    <span>
                      {t("fpPointsLabel")}: <strong>{feature.fp.points}</strong>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
