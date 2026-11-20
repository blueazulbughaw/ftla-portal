import { redirect } from "next/navigation";
import { getUser, supabaseConfigured } from "@/lib/supabase/server";
import { signIn, signInWithGoogle, signUp } from "./actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const { error, info } = await searchParams;
  if (await getUser()) redirect("/");

  return (
    <main className="wrap narrow section">
      <div className="block">
        <p className="label">Members</p>
        <h1 className="h2">Sign in or create an account</h1>
        <p className="soft">
          Your account lets you see event files and, for organizers, the admin reports.
        </p>

        {!supabaseConfigured() && (
          <p className="notice">
            Sign in isn&apos;t switched on yet. Add the Supabase keys from the README, then redeploy.
          </p>
        )}
        {error && <p className="notice error">{error}</p>}
        {info && <p className="notice">{info}</p>}

        <form>
          <button className="btn google" formAction={signInWithGoogle}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="divider">or use email</p>

        <form className="form">
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" minLength={8} required />
          </label>
          <div className="row">
            <button className="btn" formAction={signIn}>Sign in</button>
            <button className="btn ghost" formAction={signUp}>Create account</button>
          </div>
        </form>
      </div>
    </main>
  );
}
