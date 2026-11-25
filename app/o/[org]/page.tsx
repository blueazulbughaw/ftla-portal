import { redirect } from "next/navigation";

// Old address. Organization pages now live at /<org>.
export default async function OldOrgPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  redirect(`/${org === "faithtech-la" ? "ftla" : org}`);
}
