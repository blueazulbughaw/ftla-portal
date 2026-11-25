import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The link in the sign-up email lands here. We swap its code for a signed-in session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(request.cookies.get("after_login")?.value ?? null);
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(`${origin}${next}`);
      res.cookies.delete("after_login");
      return res;
    }
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That link didn't work. Try signing in.")}`);
}

/** Only allow going back to a page on this site. */
function safeNext(n: string | null): string {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/hub";
}
