import { redirect } from "next/navigation";

// The admin tools now live in the hub.
export default function AdminRedirect() {
  redirect("/hub/admin");
}
