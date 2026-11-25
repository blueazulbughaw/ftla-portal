import { notFound, redirect } from "next/navigation";
import OrgHome from "@/components/OrgHome";
import OrgTheme from "@/components/OrgTheme";
import { HOME_ORG_SLUG, allEvents, getOrg } from "@/lib/data";
import { homeSections } from "@/lib/home";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ org: string }> }) {
  const org = await getOrg((await params).org);
  return org ? { title: org.name, description: org.about } : {};
}

// An organization's homepage. Its team builds it from sections in the admin (Homepage).
export default async function OrgPage({ params }: { params: Promise<{ org: string }> }) {
  const slug = (await params).org;
  const org = await getOrg(slug);
  if (!org) {
    if (slug === "faithtech-la") redirect(`/${HOME_ORG_SLUG}`);
    notFound();
  }
  const events = await allEvents({ orgSlug: slug });
  return (
    <>
      <OrgTheme theme={org.theme} addons={org.addons} />
      <OrgHome org={org} sections={homeSections(org)} events={events} />
    </>
  );
}
