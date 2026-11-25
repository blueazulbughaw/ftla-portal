import Sessions from "@/components/hub/Sessions";

export const metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  return <Sessions mine={false} kind={kind} />;
}
