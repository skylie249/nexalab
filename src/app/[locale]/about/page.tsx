import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter, absoluteUrl } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/about"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/about" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

const stack = ["Next.js", "TypeScript", "Supabase", "Vercel", "Ollama / LLM", "spring boot", "MyBatis", "PostgreSQL", "Redis", "Docker", "Nginx"];
const PRODUCTS_TECH_STACK = ["Next.js", "TypeScript", "Supabase", "Vercel", "Ollama / LLM"];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  // 2026-11-26: /ai-apps, /biz를 About으로 병합 — 두 페이지의 제품 쇼케이스·아이디어 목록을
  // 그대로 가져와 섹션으로 추가한다(CLAUDE.md "ai-apps/biz 내용을 About으로 합친다").
  const products = [
    {
      name: "Harubite",
      emoji: "🌱",
      desc: t("products.harubiteDesc"),
      longDesc: t("products.harubiteLongDesc"),
      url: "https://harubite.nexalab.app",
      color: "#f59e0b",
      textColor: "var(--harubite-text)",
    },
    {
      name: "Paycheck",
      emoji: "💰",
      desc: t("products.paycheckDesc"),
      longDesc: t("products.paycheckLongDesc"),
      url: "https://paycheck.nexalab.app",
      color: "#10b981",
      textColor: "var(--paycheck-text)",
    },
    {
      name: "TextKit",
      emoji: "📝",
      desc: t("products.textkitDesc"),
      longDesc: t("products.textkitLongDesc"),
      url: "https://text.nexalab.app",
      color: "#6366f1",
      textColor: "var(--textkit-text)",
    },
    {
      name: "EasyPMS",
      emoji: "✅",
      desc: t("products.easypmsDesc"),
      longDesc: t("products.easypmsLongDesc"),
      url: "https://easypms.nexalab.app",
      color: "#0d9488",
      textColor: "var(--easypms-text)",
    },
    {
      name: "Toolbox",
      emoji: "🧰",
      desc: t("products.toolboxDesc"),
      longDesc: t("products.toolboxLongDesc"),
      url: "https://toolbox.nexalab.app",
      color: "#0369a1",
      textColor: "var(--toolbox-text)",
    },
  ];

  const bizIdeas = [
    { key: "idea1", emoji: "💰", title: t("bizIdeas.idea1Title"), desc: t("bizIdeas.idea1Desc"), longDesc: t("bizIdeas.idea1LongDesc") },
    { key: "idea2", emoji: "🎯", title: t("bizIdeas.idea2Title"), desc: t("bizIdeas.idea2Desc"), longDesc: t("bizIdeas.idea2LongDesc") },
    { key: "idea3", emoji: "🧭", title: t("bizIdeas.idea3Title"), desc: t("bizIdeas.idea3Desc"), longDesc: t("bizIdeas.idea3LongDesc") },
  ];
  const provenTags = [t("bizIdeas.provenTag1"), t("bizIdeas.provenTag2"), t("bizIdeas.provenTag3")];

  return (
    <div className={styles.page}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: "Kim Ho-gyun",
            jobTitle: t("role"),
            url: absoluteUrl(`/${locale}/about`),
            sameAs: ["https://github.com/skylie249/", "https://www.linkedin.com/in/nexalab0812"],
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          url: absoluteUrl(`/${locale}/about`),
          itemListElement: products.map((app, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "SoftwareApplication",
              name: app.name,
              description: app.longDesc,
              url: app.url,
              applicationCategory: "BusinessApplication",
            },
          })),
        }}
      />
      <header className={styles.intro}>
        <span className={styles.eyebrow}>{t("eyebrow")}</span>
        <h1 className={styles.title}>
          {t.rich("title", {
            highlight: (chunks) => <span className={styles.highlight}>{chunks}</span>,
          })}
        </h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </header>

      <section className={`${styles.profileCard} glass`}>
        <div className={styles.avatar}>👤</div>
        <div>
          <h2>Kim Ho-gyun</h2>
          <p className={styles.role}>{t("role")}</p>
          <p className={styles.quote}>{t("quote")}</p>
          <div className={styles.links}>
            <Link href="https://github.com/skylie249/" target="_blank" rel="noopener noreferrer">GitHub</Link>
            <Link href="https://www.linkedin.com/in/nexalab0812" target="_blank" rel="noopener noreferrer">LinkedIn</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={`${styles.card} glass`}>
          <h3>{t("whatCardTitle")}</h3>
          <p>
            {t.rich("whatCardBody", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>
        <div className={`${styles.card} glass`}>
          <h3>{t("stackCardTitle")}</h3>
          <div className={styles.tags}>
            {stack.map((s) => (
              <span key={s} className={styles.tag}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.storySection} glass`}>
        <h2>{t("storyTitle")}</h2>
        <p>{t("storyBody")}</p>
      </section>

      <section className={`${styles.storySection} glass`}>
        <h2>{t("philosophyTitle")}</h2>
        <p>{t("philosophyBody")}</p>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>{t("coverageTitle")}</h2>
        <div className={styles.gridThree}>
          <div className={`${styles.card} glass`}>
            <h3>{t("coverageAiAppsTitle")}</h3>
            <p>{t("coverageAiAppsDesc")}</p>
          </div>
          <div className={`${styles.card} glass`}>
            <h3>{t("coverageBizTitle")}</h3>
            <p>{t("coverageBizDesc")}</p>
          </div>
          <div className={`${styles.card} glass`}>
            <h3>{t("coverageToolsTitle")}</h3>
            <p>{t("coverageToolsDesc")}</p>
          </div>
        </div>
      </section>

      <section>
        <header className={styles.subsectionHeader}>
          <h2 className={styles.sectionTitle}>{t("productsTitle")}</h2>
          <p className={styles.sectionSubtitle}>{t("productsSubtitle")}</p>
        </header>
        <div className={styles.productGrid}>
          {products.map((app) => (
            <Link
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.productCard} glass`}
            >
              <div className={styles.productCardIcon} style={{ backgroundColor: `${app.color}20` }}>
                {app.emoji}
              </div>
              <div>
                <div className={styles.productCardTitleRow}>
                  <h3>{app.name}</h3>
                  <span className={styles.productStatusBadge}>{t("products.statusLabel")}</span>
                </div>
                <p className={styles.cardTagline}>{app.desc}</p>
                <p className={styles.cardLongDesc}>{app.longDesc}</p>
                <span className={styles.productLinkText} style={{ color: app.textColor }}>{t("products.goTo")}</span>
              </div>
            </Link>
          ))}
        </div>
        <div className={`${styles.techSection} glass`}>
          <h3>{t("products.techStackTitle")}</h3>
          <p>{t("products.techStackBody")}</p>
          <ul className={styles.tags}>
            {PRODUCTS_TECH_STACK.map((techItem) => (
              <li key={techItem} className={styles.tag}>{techItem}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <header className={styles.subsectionHeader}>
          <h2 className={styles.sectionTitle}>{t("bizIdeasTitle")}</h2>
          <p className={styles.sectionSubtitle}>{t("bizIdeasSubtitle")}</p>
        </header>
        <div className={styles.gridThree}>
          {bizIdeas.map((idea) => (
            <div key={idea.key} className={`${styles.card} glass`}>
              <div className={styles.productCardIconPlain}>{idea.emoji}</div>
              <h3>{idea.title}</h3>
              <p className={styles.cardTagline}>{idea.desc}</p>
              <p className={styles.cardLongDesc}>{idea.longDesc}</p>
            </div>
          ))}
        </div>
        <div className={`${styles.provenSection} glass`}>
          <h3>{t("bizIdeas.provenTitle")}</h3>
          <p>{t("bizIdeas.provenBody")}</p>
          <ul className={styles.tags}>
            {provenTags.map((tag) => (
              <li key={tag} className={styles.tag}>{tag}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${styles.audienceSection} glass`}>
        <h2>{t("audienceTitle")}</h2>
        <p>{t("audienceBody")}</p>
        <ul className={styles.tags}>
          <li className={styles.tag}>{t("audienceRole1")}</li>
          <li className={styles.tag}>{t("audienceRole2")}</li>
          <li className={styles.tag}>{t("audienceRole3")}</li>
          <li className={styles.tag}>{t("audienceRole4")}</li>
        </ul>
      </section>

      <section className={`${styles.storySection} glass`}>
        <h2>{t("principleTitle")}</h2>
        <p>{t("principleBody")}</p>
      </section>

      <section className={`${styles.note} glass`}>
        <h2>{t("contactTitle")}</h2>
        <p>{t("contactBody")}</p>
        <Link href="mailto:kimhg249@gmail.com" className={styles.cta}>{t("contactCta")}</Link>
      </section>
    </div>
  );
}
