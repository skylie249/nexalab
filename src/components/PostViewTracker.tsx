"use client";

import { useEffect } from "react";

interface PostViewTrackerProps {
  postId: string;
}

// 같은 브라우저 세션에서 새로고침/재방문 시 중복 집계되지 않도록 sessionStorage로 1회만 전송
export default function PostViewTracker({ postId }: PostViewTrackerProps) {
  useEffect(() => {
    const key = `nexalab_viewed_${postId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {});
  }, [postId]);

  return null;
}
