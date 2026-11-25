/** A simple labeled bar list: one row per item, bar length relative to the biggest. */
export default function Bars({ rows, empty = "No data yet." }: { rows: { label: string; value: number; note?: string }[]; empty?: string }) {
  if (!rows.length) return <p className="soft small">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="bars-label">{r.label}</span>
          <span className="bars-track"><span className="bars-fill" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="bars-num">{r.value}{r.note && <span className="soft"> {r.note}</span>}</span>
        </li>
      ))}
    </ul>
  );
}
