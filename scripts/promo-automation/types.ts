export interface DetectedPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  url: string;
  locale: "ko" | "en";
  updatedAt: string;
}

export interface GeneratedCopy {
  postTitle: string;
  postUrl: string;
  naverCopy: string;
  kakaoCopy: string;
  bandCopy: string;
}

export interface GenerateResult {
  post: DetectedPost;
  status: "ok" | "failed";
  copy?: GeneratedCopy;
  error?: string;
  isRateLimited?: boolean;
}

export interface DetectedPostsState {
  runTimestamp: string;
  posts: DetectedPost[];
}

export interface GeneratedCopyState {
  runTimestamp: string;
  results: GenerateResult[];
}
