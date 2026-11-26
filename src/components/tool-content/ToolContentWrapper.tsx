import type { ReactNode } from "react";
import ToolIntro from "./ToolIntro";
import ToolHowToUse, { type HowToUseStep } from "./ToolHowToUse";
import ToolRecommendFor from "./ToolRecommendFor";
import ToolResultGuide from "./ToolResultGuide";
import ToolCommonIssues, { type CommonIssueItem } from "./ToolCommonIssues";
import ToolFAQ, { type FaqItem } from "./ToolFAQ";
import ToolRelatedGuides, { type RelatedGuideLink } from "./ToolRelatedGuides";
import ToolBuildLog from "./ToolBuildLog";
import type { ToolWithBuildLog } from "@/lib/history";
import styles from "./ToolContent.module.css";

export default function ToolContentWrapper({
  introTitle,
  introProblem,
  introSolution,
  howToUseTitle,
  howToUseSteps,
  recommendForTitle,
  recommendFor,
  resultGuideTitle,
  resultGuideBody,
  commonIssuesTitle,
  commonIssues,
  faqTitle,
  faq,
  relatedGuidesTitle,
  relatedGuides,
  buildLogTool,
  children,
}: {
  introTitle: string;
  introProblem: string;
  introSolution: string;
  howToUseTitle: string;
  howToUseSteps: HowToUseStep[];
  recommendForTitle: string;
  recommendFor: string[];
  // 설명 보강 대상 도구(색인 유지)만 전달 — 미전달 시 해당 섹션은 렌더링하지 않음.
  resultGuideTitle?: string;
  resultGuideBody?: string;
  commonIssuesTitle?: string;
  commonIssues?: CommonIssueItem[];
  faqTitle: string;
  faq: FaqItem[];
  relatedGuidesTitle?: string;
  relatedGuides?: RelatedGuideLink[];
  buildLogTool?: ToolWithBuildLog;
  children: ReactNode;
}) {
  return (
    <div className={styles.wrapper}>
      <ToolIntro title={introTitle} problem={introProblem} solution={introSolution} />
      {children}
      <ToolHowToUse title={howToUseTitle} steps={howToUseSteps} />
      <ToolRecommendFor title={recommendForTitle} items={recommendFor} />
      {resultGuideTitle && resultGuideBody && (
        <ToolResultGuide title={resultGuideTitle} body={resultGuideBody} />
      )}
      {commonIssuesTitle && commonIssues && (
        <ToolCommonIssues title={commonIssuesTitle} items={commonIssues} />
      )}
      <ToolFAQ title={faqTitle} items={faq} />
      {relatedGuidesTitle && relatedGuides && (
        <ToolRelatedGuides title={relatedGuidesTitle} links={relatedGuides} />
      )}
      {buildLogTool && <ToolBuildLog tool={buildLogTool} />}
    </div>
  );
}
