// Talks to Luma's API from the server only, so the key never reaches the browser.
// Without LUMA_API_KEY, every function returns null and the pages show a hint instead.

const BASE = process.env.LUMA_API_BASE || "https://public-api.luma.com";

export function lumaConfigured(): boolean {
  return Boolean(process.env.LUMA_API_KEY);
}

async function lumaGet<T>(path: string): Promise<T | null> {
  const key = process.env.LUMA_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-luma-api-key": key, accept: "application/json" },
      next: { revalidate: 300 }, // refresh at most every 5 minutes
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type GuestEntry = { guest?: { approval_status?: string; checked_in_at?: string | null } };
type GuestPage = { entries: GuestEntry[]; has_more?: boolean; next_cursor?: string };

export type GuestSummary = { total: number; approved: number; checkedIn: number; waitlist: number };

/** Counts an event's guests by status. Returns null if Luma isn't set up or the call fails. */
export async function guestSummary(eventId: string): Promise<GuestSummary | null> {
  const summary: GuestSummary = { total: 0, approved: 0, checkedIn: 0, waitlist: 0 };
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ event_api_id: eventId, pagination_limit: "100" });
    if (cursor) qs.set("pagination_cursor", cursor);
    const data = await lumaGet<GuestPage>(`/v1/event/get-guests?${qs}`);
    if (!data) return page === 0 ? null : summary;
    for (const { guest } of data.entries ?? []) {
      summary.total++;
      if (guest?.approval_status === "approved") summary.approved++;
      if (guest?.approval_status === "waitlist") summary.waitlist++;
      if (guest?.checked_in_at) summary.checkedIn++;
    }
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return summary;
}
