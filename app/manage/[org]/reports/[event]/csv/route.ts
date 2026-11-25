import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Registrations for one event as a spreadsheet file. The database rules limit it to the event's team. */
export async function GET(_req: Request, { params }: { params: Promise<{ org: string; event: string }> }) {
  const { event } = await params;
  if (!(await getUser())) return new NextResponse("Sign in first.", { status: 401 });
  const supabase = await createClient();
  const { data: ev } = await supabase.from("events").select("slug").eq("id", event).maybeSingle();
  const { data, error } = await supabase.from("event_registrations").select("name,email,status,checked_in,source,came_from,area,registered_at,created_at").eq("event_id", event).order("created_at");
  if (error || !ev) return new NextResponse("Not found.", { status: 404 });
  const rows = [
    ["Name", "Email", "Status", "Checked in", "Source", "Came from", "Area", "Signed up"],
    ...(data ?? []).map((r) => [r.name, r.email, r.status, r.checked_in ? "yes" : "no", r.source, r.came_from, r.area, r.registered_at ?? r.created_at]),
  ];
  return new NextResponse(rows.map((r) => r.map(cell).join(",")).join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${ev.slug}-registrations.csv"` },
  });
}
