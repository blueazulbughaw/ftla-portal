import { redirect } from "next/navigation";

// Old address. Each organization's admin now lives at /<org>/admin.
export default async function OldAdminLink({ params }: { params: Promise<{ org: string; rest?: string[] }> }) {
  const { org, rest = [] } = await params;
  const slug = org === "faithtech-la" ? "ftla" : org;
  redirect(`/${slug}/admin${rest.length ? `/${rest.map(encodeURIComponent).join("/")}` : ""}`);
}
