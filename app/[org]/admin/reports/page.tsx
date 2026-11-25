import { redirect } from "next/navigation";

// Reports now live on each event (Events → the event → Attendees report).
export default async function OldReports({ params }: { params: Promise<{ org: string }> }) {
  redirect(`/${(await params).org}/admin`);
}
