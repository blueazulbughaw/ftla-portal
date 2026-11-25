import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

// Downloads all your saved contacts as one .vcf file your phone or email app can import.
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/hub/contacts", request.url));
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_my_contacts");
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const cards = (data ?? []).map((c: Record<string, string | null>) =>
    [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${esc(c.display_name ?? "FaithTech LA contact")}`,
      c.contact_email && `EMAIL:${esc(c.contact_email)}`,
      c.phone && `TEL:${esc(c.phone)}`,
      c.linkedin_url && `URL:${esc(c.linkedin_url)}`,
      c.website_url && `URL:${esc(c.website_url)}`,
      "NOTE:Met through the FaithTech LA portal",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n"),
  );
  return new NextResponse(cards.join("\r\n"), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="faithtech-la-contacts.vcf"',
    },
  });
}
