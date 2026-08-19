import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { postInputSchema } from "@/lib/postSchema";

// posts.slug는 NOT NULL(+ UNIQUE 추정) 컬럼이지만 공개 라우팅(/posts/[id])은 id 기반이라
// 실제로 노출되지 않음 — 제목 기반 slug + 짧은 랜덤 접미사로 유니크하게만 채워준다.
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "post"}-${randomUUID().slice(0, 8)}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = postInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "잘못된 입력입니다." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({
      ...parsed.data,
      slug: generateSlug(parsed.data.title),
      views: 0,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.error("post insert error:", error);
    return NextResponse.json({ error: "글 저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  revalidatePath("/ko");
  revalidatePath("/en");

  return NextResponse.json({ id: data.id });
}
