import { notFound, redirect } from "next/navigation";
import EventPublic from "@/components/EventPublic";
import OrgTheme from "@/components/OrgTheme";
import { HOME_ORG_SLUG, findEventBySlugs } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ org: string; event: string }> }) {
  const { org, event } = await params;
  const full = await findEventBySlugs(org, event);
  return full ? { title: full.event.title, description: full.event.summary } : {};
}

export default async function OrgEventPage({ params }: { params: Promise<{ org: string; event: string }> }) {
  const { org, event } = await params;
  const full = await findEventBySlugs(org, event);
  if (!full) {
    if (org === "faithtech-la") redirect(`/${HOME_ORG_SLUG}/events/${event}`);
    notFound();
  }
  return (
    <>
      <OrgTheme theme={full.org.theme} addons={full.org.addons} />
      <EventPublic full={full} />
    </>
  );
}
