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

type FullGuest = {
  guest?: {
    name?: string;
    email?: string;
    user_name?: string;
    user_email?: string;
    approval_status?: string;
    checked_in_at?: string | null;
    registered_at?: string | null;
    created_at?: string | null;
    utm_source?: string | null;
    registration_answers?: { label?: string; question?: string; answer?: unknown; value?: unknown }[];
  };
};

export type LumaGuest = { name: string; email: string; status: string; checkedIn: boolean; registeredAt: string | null; cameFrom: string | null; area: string | null; answers: Record<string, string> };

const AREA_WORDS = /area|city|where|zip|location|neighborhood|region/i;

/**
 * Every guest of a Luma event, using an organization's own API key.
 * Returns null when the key is wrong or Luma can't be reached.
 */
export async function lumaGuests(apiKey: string, eventId: string): Promise<LumaGuest[] | null> {
  const out: LumaGuest[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    const qs = new URLSearchParams({ event_api_id: eventId, pagination_limit: "100" });
    if (cursor) qs.set("pagination_cursor", cursor);
    let data: { entries?: FullGuest[]; has_more?: boolean; next_cursor?: string };
    try {
      const res = await fetch(`${BASE}/v1/event/get-guests?${qs}`, {
        headers: { "x-luma-api-key": apiKey, accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return page === 0 ? null : out;
      data = await res.json();
    } catch {
      return page === 0 ? null : out;
    }
    for (const { guest } of data.entries ?? []) {
      const email = guest?.email ?? guest?.user_email;
      if (!email) continue;
      const answers: Record<string, string> = {};
      for (const a of guest?.registration_answers ?? []) {
        const label = String(a.label ?? a.question ?? "").trim().slice(0, 120);
        const value = a.answer ?? a.value;
        if (label && value != null && value !== "") answers[label] = (Array.isArray(value) ? value.join(", ") : String(value)).slice(0, 300);
      }
      const areaKey = Object.keys(answers).find((k) => AREA_WORDS.test(k));
      out.push({
        name: guest?.name ?? guest?.user_name ?? "",
        email: email.toLowerCase(),
        status: guest?.approval_status === "approved" ? "going" : guest?.approval_status ?? "going",
        checkedIn: Boolean(guest?.checked_in_at),
        registeredAt: guest?.registered_at ?? guest?.created_at ?? null,
        cameFrom: guest?.utm_source ?? null,
        area: areaKey ? answers[areaKey] : null,
        answers,
      });
    }
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return out;
}
