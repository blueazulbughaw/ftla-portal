import { redirect } from "next/navigation";
import { hubContext } from "@/lib/hub-server";
import { EXPERIENCE_TABS } from "@/lib/hub-tabs";

export default async function ExperienceIndex() {
  const { features } = await hubContext("/hub/experience");
  const first = EXPERIENCE_TABS.find((t) => !t.feature || features.includes(t.feature));
  redirect(`/hub/experience/${first?.slug ?? "registration"}`);
}
