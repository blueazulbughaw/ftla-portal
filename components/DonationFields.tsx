import type { DonationLink } from "@/lib/data";

// The "Is it a nonprofit?" question, with donation link boxes underneath.
// The links only show once "Yes" is picked (CSS does the hiding, no JavaScript needed).
export default function DonationFields({ isNonprofit, links }: { isNonprofit?: boolean; links?: DonationLink[] }) {
  const rows = [...(links ?? []), { label: "", url: "" }, { label: "", url: "" }].slice(0, Math.max(3, (links?.length ?? 0) + 1));
  return (
    <fieldset className="npo">
      <legend>Is your organization a nonprofit (NPO)?</legend>
      <div className="row">
        <label className="inline"><input type="radio" name="is_nonprofit" value="yes" defaultChecked={isNonprofit} /> Yes</label>
        <label className="inline"><input type="radio" name="is_nonprofit" value="no" defaultChecked={!isNonprofit} /> No</label>
      </div>
      <div className="npo-links">
        <p className="soft small">Add links where people can donate. They show on your organization page and event pages.</p>
        {rows.map((d, i) => (
          <div key={i} className="donate-row">
            <label>Button text<input name="donate_label" defaultValue={d.label} placeholder="Donate" maxLength={60} /></label>
            <label>Link<input name="donate_url" defaultValue={d.url} placeholder="https://give.example.org" /></label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
