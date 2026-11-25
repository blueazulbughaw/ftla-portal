import Sessions from "@/components/hub/Sessions";

export const metadata = { title: "My schedule" };

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  return <Sessions mine kind={kind} />;
}
