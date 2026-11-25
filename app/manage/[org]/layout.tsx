import Link from "next/link";
import { manageContext } from "@/lib/manage";

export const dynamic = "force-dynamic";

export default async function ManageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const { org, role } = await manageContext(slug);
  return (
    <div className="manage">
      <div className="manage-head">
        <div>
          <p className="label">Admin · {role}</p>
          <h1 className="h2">{org.name}</h1>
        </div>
        <Link href={`/${org.slug}`} className="btn ghost small">View public page</Link>
      </div>
      <div className="manage-body">{children}</div>
    </div>
  );
}
