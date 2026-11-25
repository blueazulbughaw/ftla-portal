import { redirect } from "next/navigation";

// Old address. The resource library now lives at /<org>/resources.
export default async function OldResources({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  redirect(`/${org === "faithtech-la" ? "ftla" : org}/resources`);
}
