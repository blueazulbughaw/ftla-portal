import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function Header() {
  const user = await getUser();
  return (
    <header className="topbar">
      <div className="wrap topbar-in">
        <Link href="/" className="brand">
          FaithTech <span>LA</span>
        </Link>
        <nav className="nav">
          <Link href="/#events">Events</Link>
          <Link href="/#connect">Connect</Link>
          {user && <Link href="/hub">My hub</Link>}
          {user && <Link href="/manage">Admin</Link>}
          {!user && <Link href="/manage/new">Start an organization</Link>}
          {user ? (
            <form action={signOut}>
              <button className="linkbtn" title={user.email ?? ""}>Sign out</button>
            </form>
          ) : (
            <Link href="/login" className="btn small">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
