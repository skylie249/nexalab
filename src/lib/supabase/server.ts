import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// RSC/Route Handler 전용. 로그인 세션 확인(getUser())에 사용 — anon 키 기반이라
// RLS를 그대로 따르므로 draft 글 등 실제 데이터 읽기/쓰기는 supabase/admin.ts를 사용할 것.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component에서 호출된 경우 — 세션 갱신은 middleware가 담당하므로 무시해도 됨
          }
        },
      },
    }
  );
}
