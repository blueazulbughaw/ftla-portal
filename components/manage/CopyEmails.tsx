"use client";

import { useState } from "react";

/** Copies a list of emails, ready to paste into Mailchimp or an email's BCC. */
export default function CopyEmails({ emails, label = "Copy emails" }: { emails: string[]; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn ghost small"
      disabled={!emails.length}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(emails.join(", "));
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          // Clipboard blocked: nothing else to do.
        }
      }}
    >
      {done ? `Copied ${emails.length}` : `${label} (${emails.length})`}
    </button>
  );
}
