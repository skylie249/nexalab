import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "post-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB — supabase/post-images-bucket.sql의 file_size_limit과 동일하게 맞춘다
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

// 관리자 글쓰기 화면(PostForm)의 이미지 삽입 버튼/붙여넣기가 호출하는 업로드 엔드포인트.
// 로그인 확인 후에만 service-role 클라이언트로 Supabase Storage에 올리고 공개 URL을 돌려준다.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "이미지 파일을 선택해주세요." }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "PNG, JPEG, WebP, GIF 형식의 이미지만 업로드할 수 있습니다." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "이미지는 5MB 이하만 업로드할 수 있습니다." }, { status: 413 });
  }

  const path = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("post image upload error:", uploadError);
    return NextResponse.json({ error: "이미지 업로드 중 오류가 발생했습니다." }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
