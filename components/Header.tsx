import Link from "next/link";
import { getUser, isAdminEmail } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function Header() {
  const user = await getUser();
  const admin = isAdminEmail(user?.email);
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
          {admin && <Link href="/hub/admin">Admin</Link>}
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
