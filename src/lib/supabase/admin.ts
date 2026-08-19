import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// service-role 키 클라이언트 — RLS를 우회하므로 반드시 로그인 세션을 먼저 확인한
// admin API route / 관리자 서버 컴포넌트에서만 사용할 것. "server-only" 임포트로
// 클라이언트 번들에 실수로 포함되면 빌드 자체가 실패하도록 막는다.
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
