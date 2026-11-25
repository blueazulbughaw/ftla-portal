import Sidebar from "@/components/hub/Sidebar";
import OrgTheme from "@/components/OrgTheme";
import { hubContext } from "@/lib/hub-server";

export const dynamic = "force-dynamic";

// The attendee hub: a sidebar on the left, the page on the right.
export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const { eventKey, hubEvents, isStaff, features, full } = await hubContext();
  return (
    <div className="hub">
      {full && <OrgTheme theme={full.org.theme} addons={full.org.addons} />}
      <Sidebar
        events={hubEvents.map((e) => ({ key: e.key, title: e.event.title }))}
        current={eventKey}
        features={features}
        showAdmin={isStaff}
      />
      <div className="hub-main">{children}</div>
    </div>
  );
}
