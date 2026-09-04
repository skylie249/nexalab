import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// 조회수 증가 전용 공개 엔드포인트 — RLS(공개 SELECT만 허용)를 우회해야 하므로 service-role
// 클라이언트를 쓰되, 이 라우트가 하는 일은 정확히 "id로 특정된 글의 views + 1"로 한정된다.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: post, error: fetchError } = await supabaseAdmin
    .from("posts")
    .select("views")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const nextViews = (post.views ?? 0) + 1;
  const { error: updateError } = await supabaseAdmin
    .from("posts")
    .update({ views: nextViews })
    .eq("id", id);

  if (updateError) {
    console.error("post view increment error:", updateError);
    return NextResponse.json({ error: "조회수 업데이트 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ views: nextViews });
}
