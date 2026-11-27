-- ============================================================
-- post-images 스토리지 버킷: 관리자 글쓰기 화면의 이미지 업로드용
-- Supabase 대시보드 > SQL Editor 에서 실행하세요. (재실행해도 안전)
--
-- 업로드/삭제는 전부 service-role 키(src/app/api/admin/posts/upload-image/route.ts,
-- 로그인 확인 후에만 호출)로만 이뤄지므로 storage.objects에 별도 쓰기 정책을 추가하지
-- 않는다 — service-role은 RLS를 우회한다. public=true라 공개 URL(/storage/v1/object/public/...)
-- 로는 RLS와 무관하게 누구나 읽을 수 있다(블로그 이미지는 어차피 공개 노출 대상).
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
