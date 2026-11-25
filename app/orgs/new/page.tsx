import { redirect } from "next/navigation";

// Old address. Starting an organization now happens inside the admin.
export default function OldNewOrg() {
  redirect("/manage/new");
}
