"use client";

import { useTransition } from "react";
import Icon from "@/components/Icon";
import { toggleSession } from "@/app/hub/actions";

export default function SaveButton({ eventSlug, sessionId, saved, mode = "toggle" }: { eventSlug: string; sessionId: string; saved: boolean; mode?: "toggle" | "remove" }) {
  const [pending, start] = useTransition();
  const click = () => start(() => toggleSession(eventSlug, sessionId, !saved));
  if (mode === "remove") {
    return (
      <button className="linkbtn save" onClick={click} disabled={pending}>
        <Icon name="trash" size={14} /> {pending ? "Removing…" : "Remove"}
      </button>
    );
  }
  return (
    <button className={`linkbtn save ${saved ? "is-saved" : ""}`} onClick={click} disabled={pending} aria-pressed={saved}>
      <Icon name={saved ? "check" : "plus"} size={14} /> {pending ? "Saving…" : saved ? "In My Schedule" : "Add to Schedule"}
    </button>
  );
}
