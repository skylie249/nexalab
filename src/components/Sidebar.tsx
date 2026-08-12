import Link from "next/link";
import AdSenseMock from "./AdSenseMock";
import styles from "./Sidebar.module.css";

const liveApps = [
  { name: "Harubite", url: "https://harubite.nexalab.app" },
  { name: "Venus Gecko", url: "https://venus.nexalab.app" },
  { name: "HappyICT-ON", url: "https://on.nexalab.app" }
];

const popularPosts = [
  "Ollama 기반 로컬 LLM 환경 세팅",
  "Vercel 빌드 오류 해결 백서",
  "Spring Boot & MyBatis 최적화"
];

export default function Sidebar({ isPostDetail = false }: { isPostDetail?: boolean }) {
  return (
    <aside className={styles.sidebar}>
      {/* 1. Profile Card */}
      <div className={`${styles.widget} glass`}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>👤</div>
          <div>
            <h3 className={styles.profileName}>Kim Ho-gyun</h3>
            <p className={styles.profileRole}>Senior Software Engineer / PM</p>
          </div>
        </div>
        <p className={styles.profileQuote}>"AI 기반 앱 개발 및 아키텍처 설계"</p>
        <div className={styles.profileLinks}>
          <Link href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</Link>
          <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</Link>
          <Link href="mailto:contact@nexalab.app">Contact</Link>
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

      {/* 3. Live Ecosystem */}
      <div className={`${styles.widget} glass`}>
        <h3 className={styles.widgetTitle}>Live Ecosystem</h3>
        <ul className={styles.appList}>
          {liveApps.map((app) => (
            <li key={app.name}>
              <Link href={app.url} target="_blank" rel="noopener noreferrer">
                🔗 {new URL(app.url).hostname}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Popular Posts (Only on main page) */}
      {!isPostDetail && (
        <div className={`${styles.widget} glass`}>
          <h3 className={styles.widgetTitle}>Popular Posts</h3>
          <ol className={styles.postList}>
            {popularPosts.map((title, index) => (
              <li key={index}>
                <Link href="#">
                  <span className={styles.postNumber}>{index + 1}.</span> {title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </aside>
  );
}
