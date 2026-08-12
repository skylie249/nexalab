"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import styles from "./page.module.css";

const TABS = ["ALL", "🤖 AI Apps", "💻 Tech & Arch", "💡 Biz & Ideas"];

const FEATURED_POST = {
  category: "AI Apps",
  date: "2026.08.12",
  title: "Local LLM과 n8n을 활용한 백엔드 자동화 아키텍처 구축기",
  summary: "시니어 관점에서 설계한 파이프라인과 프롬프트 엔지니어링 실전 노하우를 바탕으로, 어떻게 n8n을 통해 100% 로컬 환경에서 작동하는 효율적인 백엔드 시스템을 만들 수 있는지 알아봅니다.",
  tags: ["AI", "n8n", "Architecture"]
};

const POSTS = [
  {
    id: 1,
    category: "Tech & Arch",
    date: "2026.08.10",
    title: "Next.js 15 & Vercel 멀티 도메인 바인딩 가이드",
    summary: "nexalab.app 서브도메인 라우팅과 SSL 설정 실무 경험을 바탕으로, Vercel 환경에서 멀티 도메인 프로젝트를 원활하게 구성하는 팁과 트러블슈팅 사례를 공유합니다.",
    tags: ["Next.js", "Vercel", "DevOps"]
  },
  {
    id: 2,
    category: "Biz & Ideas",
    date: "2026.08.05",
    title: "AI 시대의 신사업 아이디어: 파충류 케어 자동화",
    summary: "venus.nexalab.app 프로젝트를 진행하며 얻은 인사이트를 바탕으로, 비주류 도메인에서 AI가 어떻게 혁신적인 고객 경험을 만들어낼 수 있는지 비즈니스 관점에서 탐구합니다.",
    tags: ["Business", "AI", "Startup"]
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <>
      <Hero />
      
      <div className={styles.gridContainer}>
        {/* Main Content Area - 70% */}
        <section className={styles.mainArea}>
          <div className={styles.filterTabs}>
            {TABS.map((tab) => (
              <button 
                key={tab} 
                className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={styles.postList}>
            {/* Featured Post */}
            {(activeTab === "ALL" || activeTab.includes(FEATURED_POST.category)) && (
              <PostCard 
                {...FEATURED_POST} 
                isFeatured={true} 
              />
            )}

            {/* Post Cards Grid/List */}
            {POSTS.filter(post => activeTab === "ALL" || activeTab.includes(post.category)).map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>

          <div className={styles.pagination}>
            <button className={styles.pageBtn}>&lt;</button>
            <button className={`${styles.pageBtn} ${styles.activePage}`}>1</button>
            <button className={styles.pageBtn}>2</button>
            <button className={styles.pageBtn}>3</button>
            <span className={styles.pageDots}>...</span>
            <button className={styles.pageBtn}>&gt;</button>
          </div>
        </section>

        {/* Sidebar - 30% */}
        <div className={styles.sidebarWrapper}>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
