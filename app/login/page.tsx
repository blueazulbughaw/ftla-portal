import { redirect } from "next/navigation";
import { getUser, supabaseConfigured } from "@/lib/supabase/server";
import { signIn, signUp } from "./actions";

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
