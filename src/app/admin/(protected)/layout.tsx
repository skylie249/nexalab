import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/admin/LogoutButton";
import styles from "./layout.module.css";

// middleware가 1차로 막지만, 서버 컴포넌트 레벨에서도 다시 한번 확인한다(defense in depth).
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div>
      <header className={`${styles.header} glass`}>
        <div className={styles.headerInner}>
          <Link href="/admin/posts" className={styles.brand}>
            NexaLab 관리자
          </Link>
          <nav className={styles.nav}>
            <Link href="/admin/posts">글 목록</Link>
            <Link href="/admin/posts/new">새 글 작성</Link>
            <Link href="/" target="_blank">
              사이트 보기 ↗
            </Link>
          </nav>
          <div className={styles.actions}>
            <span className={styles.userEmail}>{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
