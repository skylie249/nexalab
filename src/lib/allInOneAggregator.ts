// 올인원 진단(/tools/site-check/all-in-one) 전용 순수 함수 — SEO/GEO 체커·보안 점검기·
// 애드센스 사전 점검기, 이미 존재하는 3개 리포트를 조합해 "가장 시급한 문제 N개"만 뽑아낸다.
// 새 분석 로직이 아니라 기존 3개 결과를 재구성(오케스트레이션)하는 레이어라는 기획서 3-4번
// 원칙 그대로 — 네트워크 호출도, 새 채점 기준도 여기서 만들지 않는다.

import type { AnalysisReport } from "./seoGeoTypes";
import type { SecurityCheckReport } from "./securityCheckTypes";
import type { AdsensePrecheckReport } from "./adsensePrecheckTypes";

export type TopIssueTool = "seo" | "security" | "adsense";

export interface TopIssue {
  tool: TopIssueTool;
  title: string;
  detail: string;
}

export interface AggregateInput {
  seo?: AnalysisReport;
  security?: SecurityCheckReport;
  adsense?: AdsensePrecheckReport;
}

export function aggregateTopIssues(input: AggregateInput, limit = 3): TopIssue[] {
  const collected: TopIssue[] = [];

  function collect<T extends { title: string; detail: string; status: string }>(
    tool: TopIssueTool,
    checks: T[] | undefined,
    filter: (check: T) => boolean
  ) {
    if (!checks) return;
    for (const check of checks) {
      if (collected.length >= limit) return;
      if (filter(check)) collected.push({ tool, title: check.title, detail: check.detail });
    }
  }

  // 1순위: 보안 점검기의 "즉시 조치 필요"(critical) 항목 — 3개 리포트를 통틀어 가장 심각도가 높음.
  collect("security", input.security?.checks, (c) => Boolean(c.critical) && c.status === "fail");
  // 2순위: 나머지 실패(fail) 항목들 — 보안 → SEO/GEO/접근성 → 애드센스 순으로, limit에 도달할 때까지.
  collect("security", input.security?.checks, (c) => !c.critical && c.status === "fail");
  collect("seo", input.seo?.checks, (c) => c.status === "fail");
  collect("adsense", input.adsense?.checks, (c) => c.status === "fail");

  return collected.slice(0, limit);
}
