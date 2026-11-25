// Webhook for other apps to add registrations: POST /api/webhooks/{org}?secret=...
// Body: { "event": "event-web-address", "name": "...", "email": "...", "status": "going", "checked_in": false }
// The database function checks the secret, so this route needs no signed-in user.

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseUrl } from "@/lib/supabase/config";

const MESSAGES: Record<string, [number, string]> = {
  ok: [200, "Saved."],
  unauthorized: [401, "Wrong secret, or this organization doesn't have the integrations add-on."],
  no_event: [404, "No event with that web address."],
  bad_email: [400, "Send an email address."],
};

export async function POST(req: Request, { params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") || req.headers.get("x-webhook-secret") || "";
  let body: Record<string, unknown> = {};
  try {
    const type = req.headers.get("content-type") ?? "";
    body = type.includes("json") ? await req.json() : Object.fromEntries(await req.formData());
  } catch {
    return NextResponse.json({ ok: false, error: "Send JSON or form data." }, { status: 400 });
  }
  const s = (k: string) => (body[k] == null ? null : String(body[k]));
  const supabase = createClient(supabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(), { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("webhook_register", {
    org_slug: org,
    secret,
    event_slug: s("event") ?? s("event_slug") ?? "",
    p_name: s("name"),
    p_email: s("email"),
    p_status: s("status"),
    p_checked_in: body.checked_in === true || body.checked_in === "true",
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const [status, message] = MESSAGES[String(data)] ?? [500, "Unknown result."];
  return NextResponse.json({ ok: status === 200, message }, { status });
}
