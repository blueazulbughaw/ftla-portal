import Sidebar from "@/components/hub/Sidebar";
import { hubContext } from "@/lib/hub-server";
import { hubEvents } from "@/lib/hub";

export const dynamic = "force-dynamic";

// The attendee hub: a sidebar on the left, the page on the right.
export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const { event, isStaff } = await hubContext();
  return (
    <div className="hub">
      <Sidebar
        events={hubEvents().map((e) => ({ slug: e.slug, title: e.title }))}
        current={event.slug}
        showAdmin={isStaff}
      />
      <div className="hub-main">{children}</div>
    </div>
  );
}
