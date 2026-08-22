"use client";

import { useState } from "react";
import styles from "./KakaoShareButton.module.css";

interface KakaoShareButtonProps {
  /** 버튼 라벨 (호출하는 페이지에서 로케일에 맞게 번역해 전달) */
  label: string;
  /** 카카오 SDK 미초기화 시 클립보드 폴백 성공 메시지 */
  copiedMessage: string;
  /** 카카오톡 카드 제목 */
  cardTitle: string;
  /** 카카오톡 카드 설명 */
  cardDescription: string;
  /** 카드 하단 버튼 문구 */
  buttonTitle: string;
  /** 카드 하단 버튼이 연결될 URL (보통 도구 메인 페이지) */
  buttonUrl: string;
  /** 공유될 결과 페이지 전체 URL (카드 본문 클릭 시 이동) */
  resultUrl: string;
  /** 카드 썸네일 이미지 URL */
  imageUrl: string;
  /** 클릭 시 애널리틱스 이벤트 등을 전송하기 위한 콜백 (선택) */
  onShareClick?: () => void;
}

export default function KakaoShareButton({
  label,
  copiedMessage,
  cardTitle,
  cardDescription,
  buttonTitle,
  buttonUrl,
  resultUrl,
  imageUrl,
  onShareClick,
}: KakaoShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    onShareClick?.();

    const kakao = window.Kakao;
    if (kakao && kakao.isInitialized()) {
      try {
        kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title: cardTitle,
            description: cardDescription,
            imageUrl,
            link: { mobileWebUrl: resultUrl, webUrl: resultUrl },
          },
          buttons: [
            {
              title: buttonTitle,
              link: { mobileWebUrl: buttonUrl, webUrl: buttonUrl },
            },
          ],
        });
        return;
      } catch {
        // Kakao SDK 호출 자체가 실패하면 아래 클립보드 폴백으로 넘어감
      }
    }

    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API를 쓸 수 없는 환경(권한 거부 등) — 조용히 무시
    }
  }

  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.kakaoButton} onClick={handleClick}>
        <span aria-hidden="true">💬</span> {label}
      </button>
      {copied && <span className={styles.copiedMessage}>{copiedMessage}</span>}
    </div>
  );
}
