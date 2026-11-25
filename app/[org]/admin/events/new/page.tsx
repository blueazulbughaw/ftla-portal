import EventForm from "@/components/manage/EventForm";
import Notice from "@/components/hub/Notice";
import { manageContext } from "@/lib/manage";
import type { FeatureKey } from "@/lib/features";

export default async function NewEvent({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ org: slug }, { error }] = await Promise.all([params, searchParams]);
  const { supabase, org } = await manageContext(slug);
  const { data: types } = await supabase.from("event_types").select("id,name,features").eq("org_id", org.id).order("name");
  return (
    <>
      <h2 className="h3">Add an event</h2>
      <Notice error={error} />
      <EventForm org={org} types={(types ?? []) as { id: string; name: string; features: FeatureKey[] }[]} />
    </>
  );
}
