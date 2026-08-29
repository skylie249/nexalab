import type { ReactNode } from "react";
import ToolIntro from "./ToolIntro";
import ToolHowToUse, { type HowToUseStep } from "./ToolHowToUse";
import ToolRecommendFor from "./ToolRecommendFor";
import ToolFAQ, { type FaqItem } from "./ToolFAQ";
import ToolRelatedPosts, { type RelatedPost } from "./ToolRelatedPosts";
import styles from "./ToolContent.module.css";

export default function ToolContentWrapper({
  introTitle,
  introProblem,
  introSolution,
  howToUseTitle,
  howToUseSteps,
  recommendForTitle,
  recommendFor,
  faqTitle,
  faq,
  relatedPostsTitle,
  relatedPosts = [],
  children,
}: {
  introTitle: string;
  introProblem: string;
  introSolution: string;
  howToUseTitle: string;
  howToUseSteps: HowToUseStep[];
  recommendForTitle: string;
  recommendFor: string[];
  faqTitle: string;
  faq: FaqItem[];
  relatedPostsTitle?: string;
  relatedPosts?: RelatedPost[];
  children: ReactNode;
}) {
  return (
    <div className={styles.wrapper}>
      <ToolIntro title={introTitle} problem={introProblem} solution={introSolution} />
      {children}
      <ToolHowToUse title={howToUseTitle} steps={howToUseSteps} />
      <ToolRecommendFor title={recommendForTitle} items={recommendFor} />
      <ToolFAQ title={faqTitle} items={faq} />
      {relatedPostsTitle && (
        <ToolRelatedPosts title={relatedPostsTitle} posts={relatedPosts} />
      )}
    </div>
  );
}
