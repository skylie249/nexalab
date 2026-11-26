import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { postInputSchema } from "@/lib/postSchema";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
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

  const { data: before } = await supabaseAdmin.from("posts").select("category").eq("id", id).maybeSingle();

  const { error } = await supabaseAdmin
    .from("posts")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("post update error:", error);
    return NextResponse.json({ error: "글 수정 중 오류가 발생했습니다." }, { status: 500 });
  }

  revalidatePath("/ko");
  revalidatePath("/ko/guides");
  revalidatePath(`/ko/guides/${parsed.data.category}`);
  if (before?.category && before.category !== parsed.data.category) {
    revalidatePath(`/ko/guides/${before.category}`);
  }
  // 글 URL이 slug 기반이라 id로는 경로를 알 수 없음 — 가이드 상세 라우트 전체를 재검증
  revalidatePath("/[locale]/guides/[category]/[slug]", "page");

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: before } = await supabaseAdmin.from("posts").select("category").eq("id", id).maybeSingle();

  const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);

  if (error) {
    console.error("post delete error:", error);
    return NextResponse.json({ error: "글 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }

  revalidatePath("/ko");
  revalidatePath("/ko/guides");
  if (before?.category) revalidatePath(`/ko/guides/${before.category}`);
  // 글 URL이 slug 기반이라 id로는 경로를 알 수 없음 — 가이드 상세 라우트 전체를 재검증
  revalidatePath("/[locale]/guides/[category]/[slug]", "page");

  return NextResponse.json({ ok: true });
}
