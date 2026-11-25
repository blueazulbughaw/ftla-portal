import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function Header() {
  const user = await getUser();
  return (
    <header className="topbar">
      <div className="wrap topbar-in">
        <Link href="/" className="brand">
          Community <span>Hub</span>
        </Link>
        <nav className="nav">
          <Link href="/ftla">FaithTech LA</Link>
          {user && <Link href="/hub">My hub</Link>}
          {user && <Link href="/manage">Admin</Link>}
          {!user && <Link href="/manage/new">Set up your organization</Link>}
          {user ? (
            <form action={signOut}>
              <button className="linkbtn" title={user.email ?? ""}>Sign out</button>
            </form>
          ) : (
            <Link href="/login" className="btn small">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
