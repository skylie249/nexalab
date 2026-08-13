import "server-only";
import { createClient } from "@supabase/supabase-js";

// service_role 키는 RLS(Row Level Security)를 완전히 우회합니다.
// 이 파일은 서버 전용이며, 클라이언트 컴포넌트에서 import하면 빌드 시 에러가 납니다 (server-only 패키지).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-key",
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);
