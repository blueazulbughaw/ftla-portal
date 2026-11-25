import { headers } from "next/headers";
import AddonGate from "@/components/manage/AddonGate";
import Notice from "@/components/hub/Notice";
import { newWebhookSecret, saveLumaKey, syncLuma } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";
import { PROVIDERS } from "@/lib/integrations";

export default async function Integrations({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const { supabase, org, hasAddon, isOrgAdmin } = await manageContext(slug);
  if (!hasAddon("integrations")) return <AddonGate addon="integrations" org={org.slug} />;
  const { data: secret } = await supabase.from("org_secrets").select("luma_api_key,webhook_secret").eq("org_id", org.id).maybeSingle();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const hookUrl = secret?.webhook_secret ? `${origin}/api/webhooks/${org.slug}?secret=${secret.webhook_secret}` : null;
  const hidden = (
    <>
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="org_id" value={org.id} />
    </>
  );
  const example = JSON.stringify({ event: "your-event-web-address", name: "Ada Lovelace", email: "ada@example.com", status: "going", checked_in: false, came_from: "instagram", area: "Pasadena" }, null, 2);
  return (
    <div className="grid2">
      <Notice ok={ok} error={error} />
      <div className="block providers">
        <h2 className="h3">Connected apps</h2>
        <p className="soft small">Guests from every app land in the same registration list, so reports and check-in work the same way.</p>
        <div className="grid">
          {PROVIDERS.map((p) => (
            <div key={p.key} className="card">
              <span className="row"><strong>{p.label}</strong><span className={`pill ${p.status === "available" ? "" : "soon"}`}>{p.status === "available" ? "Available" : "Coming soon"}</span></span>
              <span className="soft small">{p.body}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="block">
        <h2 className="h3">Luma</h2>
        <p className="soft small">Paste your Luma API key (Luma: Calendar, Settings, Developer). Then add each event&apos;s Luma event id on the event&apos;s page, and press Sync to pull in guests.</p>
        {!isOrgAdmin && <p className="notice">Only owners and admins can see or change the key.</p>}
        {isOrgAdmin && (
          <form action={saveLumaKey} className="form">
            {hidden}
            <label>
              Luma API key
              <input name="luma_api_key" type="password" autoComplete="off" placeholder={secret?.luma_api_key ? "Saved. Paste a new one to replace it." : "secret-..."} />
            </label>
            <p><button className="btn small">Save key</button></p>
          </form>
        )}
        <form action={syncLuma}>
          {hidden}
          <button className="btn ghost small">Sync guests from Luma now</button>
        </form>
      </div>

      <div className="block">
        <h2 className="h3">Webhooks</h2>
        <p className="soft small">Any app that can send a webhook (Zapier, Make, Google Forms, Typeform, Luma automations) can add registrations. Send a POST with JSON like the example to this address.</p>
        {hookUrl ? <code className="codebox">{hookUrl}</code> : <p className="soft">No webhook address yet.</p>}
        <pre className="codebox">{example}</pre>
        <p className="soft small"><code>event</code> is the event&apos;s web address (the last part of its link). Keep the address secret, since anyone with it can add registrations.</p>
        {isOrgAdmin && (
          <form action={newWebhookSecret}>
            {hidden}
            <button className="btn ghost small">{hookUrl ? "Make a new address (the old one stops working)" : "Make a webhook address"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
