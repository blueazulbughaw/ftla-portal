import { redirect } from "next/navigation";
import DonationFields from "@/components/DonationFields";
import Notice from "@/components/hub/Notice";
import { createOrg } from "@/app/manage/actions";
import { getUser, supabaseConfigured } from "@/lib/supabase/server";
import { BASIC_PLAN } from "@/lib/features";

export const metadata = { title: "Start an organization" };
export const dynamic = "force-dynamic";

export default async function NewOrg({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!supabaseConfigured()) redirect("/login");
  if (!(await getUser())) redirect("/login?next=/manage/new");
  return (
    <div className="manage">
      <form action={createOrg} className="block form narrow-form">
        <p className="label">Organizations</p>
        <h1 className="h2">Start your organization</h1>
        <p className="soft">{BASIC_PLAN}</p>
        <Notice error={error} />
        <label>Organization name<input name="name" required maxLength={120} placeholder="FaithTech LA" /></label>
        <label>
          Web address
          <span className="slug-field"><span className="soft">common-hub.vercel.app/</span><input name="slug" maxLength={60} placeholder="ftla" pattern="[a-z0-9-]*" /></span>
          <span className="soft small hint">Lowercase letters, numbers and dashes. Leave empty to use the name.</span>
        </label>
        <label>About<textarea name="about" rows={3} maxLength={2000} placeholder="Who you are and who your events are for." /></label>
        <label>Website<input name="website" placeholder="https://" /></label>
        <label>Contact email<input name="contact_email" type="email" /></label>
        <DonationFields />
        <button className="btn">Create organization</button>
      </form>
    </div>
  );
}
