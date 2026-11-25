import AdminShell from "@/components/manage/AdminShell";

export const dynamic = "force-dynamic";

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
