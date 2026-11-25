import { notFound, redirect } from "next/navigation";
import EventPublic from "@/components/EventPublic";
import { HOME_ORG_SLUG, eventHref, findEventBySlugs } from "@/lib/data";

export const dynamic = "force-dynamic"; // events now come from the database

// FaithTech LA's original event links. Once events live in the database, these forward to /o/faithtech-la/<event>.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const full = await findEventBySlugs(HOME_ORG_SLUG, (await params).slug);
  return full ? { title: full.event.title, description: full.event.summary } : {};
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const full = await findEventBySlugs(HOME_ORG_SLUG, (await params).slug);
  if (!full) notFound();
  if (full.fromDb) redirect(eventHref(full));
  return <EventPublic full={full} />;
}
