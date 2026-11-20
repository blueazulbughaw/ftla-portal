import { LINKS } from "@/lib/events";

export const metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <main className="wrap narrow section">
      <div className="block">
        <p className="label">Last updated November 20, 2026</p>
        <h1 className="h2">Terms of use</h1>
        <p>
          This site is run by FaithTech LA to share events and files with our community. By using it, you agree
          to use it kindly and lawfully, and not to share files marked for members with people outside the
          community without asking.
        </p>
        <p>
          We provide the site as it is and may change or remove features at any time. We may close accounts that
          misuse it. How we handle your information is in our <a href="/privacy">privacy policy</a>.
        </p>
        <p>
          Questions? Email <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>.
        </p>
      </div>
    </main>
  );
}
