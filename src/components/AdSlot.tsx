"use client";

import { useEffect } from "react";
import { ADSENSE_APPROVED, ADSENSE_CLIENT, ADSENSE_SLOTS, type AdPlacement } from "@/lib/adsense";

interface AdSlotProps {
  placement: AdPlacement;
  // 위치별 여백/sticky 등 래퍼 스타일 — 광고가 렌더링되지 않으면 래퍼도 함께 사라진다.
  className?: string;
}

export default function AdSlot({ placement, className }: AdSlotProps) {
  const slot = ADSENSE_SLOTS[placement];
  const enabled = ADSENSE_APPROVED && slot !== "";

  useEffect(() => {
    if (!enabled) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 스크립트 미로드/광고 차단기 — 광고 없이 페이지는 정상 동작
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
