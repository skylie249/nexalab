import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { historyInputSchema } from "@/lib/historySchema";

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
  const parsed = historyInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "잘못된 입력입니다." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("history_entries")
    .select("slug")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin
    .from("history_entries")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 사용 중인 slug입니다." }, { status: 409 });
    }
    console.error("history update error:", error);
    return NextResponse.json({ error: "연혁 수정 중 오류가 발생했습니다." }, { status: 500 });
  }

  revalidatePath("/ko/history");
  revalidatePath("/en/history");
  revalidatePath(`/ko/history/${parsed.data.slug}`);
  revalidatePath(`/en/history/${parsed.data.slug}`);
  if (existing && existing.slug !== parsed.data.slug) {
    revalidatePath(`/ko/history/${existing.slug}`);
    revalidatePath(`/en/history/${existing.slug}`);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: existing } = await supabaseAdmin
    .from("history_entries")
    .select("slug")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin.from("history_entries").delete().eq("id", id);

  if (error) {
    console.error("history delete error:", error);
    return NextResponse.json({ error: "연혁 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }

  revalidatePath("/ko/history");
  revalidatePath("/en/history");
  if (existing) {
    revalidatePath(`/ko/history/${existing.slug}`);
    revalidatePath(`/en/history/${existing.slug}`);
  }

  return NextResponse.json({ ok: true });
}
