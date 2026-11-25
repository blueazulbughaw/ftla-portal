import Link from "next/link";
import ManageTabs from "@/components/manage/ManageTabs";
import { manageContext } from "@/lib/manage";

export const dynamic = "force-dynamic";

export default async function ManageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const { org, role } = await manageContext(slug);
  return (
    <main className="wrap section manage">
      <div className="manage-head">
        <div>
          <p className="label">Manage · {role}</p>
          <h1 className="h2">{org.name}</h1>
        </div>
        <Link href={`/o/${org.slug}`} className="btn ghost small">View public page</Link>
      </div>
      <ManageTabs org={org.slug} />
      <div className="manage-body">{children}</div>
    </main>
  );
}
