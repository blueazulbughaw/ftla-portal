import { redirect } from "next/navigation";

// The attendee report now lives on each event's Attendees tab.
export default async function OldEventReport({ params }: { params: Promise<{ org: string; event: string }> }) {
  const { org, event } = await params;
  redirect(`/manage/${org}/events/${event}/attendees`);
}
