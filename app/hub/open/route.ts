import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { hubEventList } from "@/lib/hub-server";
import { HUB_EVENT_COOKIE } from "@/lib/hub";

// "Add to my upcoming events" on an event page: signs you in if needed, then opens the hub on that event.
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("event") ?? "";
  const here = `/hub/open?event=${encodeURIComponent(key)}`;
  if (!(await getUser())) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(here)}`, request.url));
  const found = (await hubEventList()).find((e) => e.key === key);
  const res = NextResponse.redirect(new URL("/hub", request.url));
  if (found) res.cookies.set(HUB_EVENT_COOKIE, found.key, { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax" });
  return res;
}
