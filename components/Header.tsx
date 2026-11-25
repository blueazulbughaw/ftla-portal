import Link from "next/link";
import { getUser } from "@/lib/supabase/server";

export default async function Header() {
  const user = await getUser();
  return (
    <header className="topbar">
      <div className="wrap topbar-in">
        <Link href="/" className="brand">
          Community <span>Hub</span>
        </Link>
        {/* Signed in, every link lives in the sidebar (admin and hub). */}
        {!user && (
          <nav className="nav">
            <Link href="/manage/new">Create an organization</Link>
            <Link href="/login" className="btn small">Log in</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
