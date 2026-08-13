export type Industry = "web_dev" | "design" | "marketing" | "video";

interface IndustryPreset {
  label: string;
  /** AI에게 업종 맥락을 알려주기 위한 설명 */
  promptContext: string;
  /** 사용자가 시간당 단가를 입력하지 않았을 때 기준으로 삼을 일당(원) */
  defaultDailyRate: number;
  /** 업종별 대표 작업 항목 예시 (프롬프트 힌트용) */
  sampleTasks: string[];
}

export const INDUSTRY_PRESETS: Record<Industry, IndustryPreset> = {
  web_dev: {
    label: "웹/앱 개발",
    promptContext:
      "웹사이트, 웹 애플리케이션, 모바일 앱 등 소프트웨어 개발 프로젝트입니다. 기획, UI/UX 디자인, 프론트엔드, 백엔드, 결제/외부 연동, QA, 배포, 유지보수 등으로 항목을 분류하세요.",
    defaultDailyRate: 350000,
    sampleTasks: ["기획/요구사항 정의", "UI/UX 디자인", "프론트엔드 개발", "백엔드/API 개발", "결제·외부 서비스 연동", "QA/테스트", "배포 및 초기 유지보수"],
  },
  design: {
    label: "디자인",
    promptContext:
      "브랜딩, UI/UX, 그래픽, 편집 디자인 등 디자인 프로젝트입니다. 리서치/컨셉, 시안 제작, 수정, 최종 산출물(가이드라인 등)로 항목을 분류하세요.",
    defaultDailyRate: 280000,
    sampleTasks: ["레퍼런스 조사 및 컨셉 기획", "시안 디자인 (1~2차)", "수정 및 피드백 반영", "최종 산출물 및 가이드라인 제작"],
  },
  marketing: {
    label: "마케팅",
    promptContext:
      "퍼포먼스 마케팅, 콘텐츠 마케팅, SNS 운영, 광고 캠페인 등 마케팅 프로젝트입니다. 전략 수립, 콘텐츠 제작, 광고 세팅/운영, 리포팅으로 항목을 분류하세요.",
    defaultDailyRate: 300000,
    sampleTasks: ["마케팅 전략 및 채널 기획", "콘텐츠/소재 제작", "광고 세팅 및 운영", "성과 분석 및 리포팅"],
  },
  video: {
    label: "영상 제작",
    promptContext:
      "홍보 영상, 광고, SNS 숏폼 등 영상 제작 프로젝트입니다. 기획/시나리오, 촬영, 편집, 후반 작업(색보정/자막/모션그래픽)으로 항목을 분류하세요.",
    defaultDailyRate: 320000,
    sampleTasks: ["기획 및 시나리오 작성", "촬영", "1차 편집", "색보정/자막/모션그래픽 등 후반 작업"],
  },
};

export const INDUSTRY_OPTIONS = (Object.keys(INDUSTRY_PRESETS) as Industry[]).map((value) => ({
  value,
  label: INDUSTRY_PRESETS[value].label,
}));

export function isIndustry(value: string): value is Industry {
  return value in INDUSTRY_PRESETS;
}
