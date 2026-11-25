// Shows the "Saved" or error message that a form sends back in the address bar.
export default function Notice({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <p className="notice error" role="alert">{error}</p>;
  if (ok) return <p className="notice" role="status">{ok}</p>;
  return null;
}

export function SetupNotice() {
  return (
    <p className="notice">
      The hub&apos;s database tables aren&apos;t set up yet, so saving won&apos;t work. Run{" "}
      <code>supabase/schema.sql</code> in Supabase&apos;s SQL Editor (see the README).
    </p>
  );
}
