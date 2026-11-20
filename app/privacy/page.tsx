import { LINKS } from "@/lib/events";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <main className="wrap narrow section">
      <div className="block">
        <p className="label">Last updated November 20, 2026</p>
        <h1 className="h2">Privacy policy</h1>
        <p>
          This site is run by FaithTech LA, the Los Angeles chapter of FaithTech. This page explains what we keep
          when you use it.
        </p>
        <h2 className="h3">What we collect</h2>
        <p>
          When you create an account, or sign in with Google, we receive your name, email address and profile
          picture. If you use email sign in, we also keep a securely hashed password. We don&apos;t ask Google for
          anything else.
        </p>
        <h2 className="h3">How we use it</h2>
        <p>
          We use it only to sign you in, show you event files, and run FaithTech LA events, for example knowing
          who signed up or checked in. We don&apos;t sell it, and we don&apos;t share it with anyone except the
          services that run this site.
        </p>
        <h2 className="h3">Services we use</h2>
        <p>
          Accounts are stored with Supabase, the site is hosted on Vercel, and Google handles Google sign in.
          Each keeps data under its own privacy policy.
        </p>
        <h2 className="h3">Your choices</h2>
        <p>
          You can ask us to see or delete your account and data at any time by emailing{" "}
          <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>.
        </p>
      </div>
    </main>
  );
}
