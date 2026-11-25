import { redirect } from "next/navigation";
import { HOME_ORG_SLUG } from "@/lib/data";

// FaithTech LA's original event links. They now live under the organization: /ftla/events/<event>.
export default async function OldEventLink({ params }: { params: Promise<{ slug: string }> }) {
  redirect(`/${HOME_ORG_SLUG}/events/${(await params).slug}`);
}
