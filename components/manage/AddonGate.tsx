import Link from "next/link";
import { ADDONS, type AddonKey } from "@/lib/features";

/** Shown in place of a page when the organization doesn't have that add-on yet. */
export default function AddonGate({ addon, org }: { addon: AddonKey; org: string }) {
  const a = ADDONS.find((x) => x.key === addon)!;
  return (
    <div className="block">
      <h2 className="h3">{a.label} is an add-on</h2>
      <p className="soft">{a.body}</p>
      <p><Link href={`/manage/${org}/addons`} className="btn">See add-ons</Link></p>
    </div>
  );
}
