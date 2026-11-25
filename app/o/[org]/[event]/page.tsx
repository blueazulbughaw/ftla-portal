import { redirect } from "next/navigation";

// Old address. Event pages now live at /<org>/events/<event>.
export default async function OldEventPage({ params }: { params: Promise<{ org: string; event: string }> }) {
  const { org, event } = await params;
  redirect(`/${org === "faithtech-la" ? "ftla" : org}/events/${event}`);
}
