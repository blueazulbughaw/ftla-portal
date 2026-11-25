import Link from "next/link";
import { notFound } from "next/navigation";
import Notice from "@/components/hub/Notice";
import { addStarterRows, deletePlanItem, savePlanItem, setPlanningTools } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";
import { DEFAULT_PLAN_TOOLS, PLAN_TOOLS, fmtMoney, money, type Field, type PlanTool } from "@/lib/planning";

type Item = { id: string; tool: string; position: number; data: Record<string, string | boolean | undefined> };

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

/** One cell's input. `form` ties it to that row's form, so a whole table row can be one form. */
function Input({ f, value, form }: { f: Field; value: unknown; form: string }) {
  const v = value == null ? "" : String(value);
  const name = `f_${f.key}`;
  const common = { name, form, "aria-label": f.label };
  switch (f.type) {
    case "check":
      return <input type="checkbox" {...common} defaultChecked={value === true} />;
    case "select":
      return (
        <select {...common} defaultValue={v}>
          <option value="">—</option>
          {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "long":
      return <textarea {...common} defaultValue={v} rows={1} />;
    case "date":
      return <input type="date" {...common} defaultValue={v} />;
    case "number":
    case "money":
      return <input inputMode="decimal" {...common} defaultValue={v} placeholder={f.type === "money" ? "$" : ""} className="num" />;
    case "email":
      return <input type="email" {...common} defaultValue={v} />;
    default:
      return <input {...common} defaultValue={v} />;
  }
}

function Shown({ f, value }: { f: Field; value: unknown }) {
  if (f.type === "url" && value) return <a href={String(value)} target="_blank" rel="noopener" className="small">Open</a>;
  return null;
}

export default async function Plan({ params, searchParams }: { params: Promise<{ org: string; id: string }>; searchParams: Promise<{ tool?: string; ok?: string; error?: string }> }) {
  const [{ org: slug, id }, sp] = await Promise.all([params, searchParams]);
  const { supabase, org, isOrgAdmin } = await manageContext(slug);
  const { data: event } = await supabase.from("events").select("id,title,starts_on,planning_tools").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!event) notFound();
  const enabled = ((event.planning_tools as string[] | null) ?? DEFAULT_PLAN_TOOLS).filter((k) => PLAN_TOOLS.some((t) => t.key === k));
  const tools = PLAN_TOOLS.filter((t) => enabled.includes(t.key));
  const tool: PlanTool | undefined = tools.find((t) => t.key === sp.tool) ?? tools[0];
  const { data: all } = await supabase.from("plan_items").select("id,tool,position,data").eq("event_id", id).order("position");
  const items = (all ?? []) as Item[];
  const rows = tool ? items.filter((i) => i.tool === tool.key) : [];

  // The summary across tools.
  const tasks = items.filter((i) => i.tool === "tasks");
  const done = tasks.filter((t) => t.data.status === "Done").length;
  const overdue = tasks.filter((t) => t.data.status !== "Done" && t.data.due && String(t.data.due) < today()).length;
  const budget = items.filter((i) => i.tool === "budget");
  const sum = (list: Item[], k: string) => list.reduce((n, i) => n + money(i.data[k]), 0);
  const spentOrPlanned = (list: Item[]) => list.reduce((n, i) => n + (i.data.actual ? money(i.data.actual) : money(i.data.estimate)), 0);
  const expenses = budget.filter((b) => b.data.kind !== "Funding");
  const funding = budget.filter((b) => b.data.kind === "Funding");
  const shopping = items.filter((i) => i.tool === "shopping");
  const shoppingCost = shopping.reduce((n, i) => n + (i.data.actual ? money(i.data.actual) : money(i.data.total)), 0);
  const remaining = spentOrPlanned(funding) - spentOrPlanned(expenses);

  const hidden = (
    <>
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="org_id" value={org.id} />
      <input type="hidden" name="event_id" value={id} />
    </>
  );

  const groups = tool?.groupBy
    ? [...(tool.fields.find((f) => f.key === tool.groupBy)?.options ?? []), ""].map((g) => ({ g, list: rows.filter((r) => String(r.data[tool.groupBy!] ?? "") === g) })).filter((x) => x.list.length)
    : [{ g: "", list: rows }];

  return (
    <div className="plan">
      <p className="soft small">Only your team sees planning. Track to-dos, budget, venues, promotion and more for this event.</p>
      <Notice ok={sp.ok} error={sp.error} />

      <dl className="stats plan-stats">
        {enabled.includes("tasks") && <div><dt>{done}/{tasks.length}</dt><dd>to-dos done{overdue ? `, ${overdue} overdue` : ""}</dd></div>}
        {enabled.includes("budget") && <div><dt>{fmtMoney(spentOrPlanned(expenses))}</dt><dd>expenses, {fmtMoney(remaining)} {remaining < 0 ? "over budget" : "left"}</dd></div>}
        {enabled.includes("shopping") && <div><dt>{fmtMoney(shoppingCost)}</dt><dd>shopping list ({shopping.filter((s) => s.data.bought).length} of {shopping.length} bought)</dd></div>}
      </dl>

      <nav className="chips" aria-label="Planning tools">
        {tools.map((t) => (
          <Link key={t.key} href={`/${org.slug}/admin/events/${id}/plan?tool=${t.key}`} className={`chip ${t.key === tool?.key ? "on" : ""}`}>
            {t.label} <span className="soft">{items.filter((i) => i.tool === t.key).length}</span>
          </Link>
        ))}
      </nav>

      {isOrgAdmin && (
        <details className="block">
          <summary><strong>Choose planning tools for this event</strong></summary>
          <form action={setPlanningTools} className="form">
            {hidden}
            <div className="chips">
              {PLAN_TOOLS.map((t) => (
                <label key={t.key} className="chip check" title={t.help}>
                  <input type="checkbox" name="tools" value={t.key} defaultChecked={enabled.includes(t.key)} /> {t.label}
                </label>
              ))}
            </div>
            <p><button className="btn small">Save tools</button></p>
          </form>
        </details>
      )}

      {!tool ? (
        <p className="notice">No planning tools are switched on for this event.</p>
      ) : (
        <div className="block">
          <h3 className="h3">{tool.label}</h3>
          <p className="soft small">{tool.help} Change a row, then press Save on that row.</p>
          <div className="table-wrap">
            <table className="table plan-table">
              <thead>
                <tr>
                  {tool.fields.map((f) => <th key={f.key} className={f.wide ? "wide" : f.type === "money" || f.type === "number" ? "num" : ""}>{f.label}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {groups.map(({ g, list }) => (
                  <PlanGroup key={g || "none"} label={tool.groupBy ? g || "Not set" : ""} cols={tool.fields.length + 1}>
                    {list.map((r) => {
                      const formId = `row-${r.id}`;
                      const late = tool.key === "tasks" && r.data.status !== "Done" && r.data.due && String(r.data.due) < today();
                      return (
                        <tr key={r.id} className={`${r.data.status === "Done" || r.data.status === "Not suitable" ? "is-done" : ""} ${late ? "is-late" : ""}`}>
                          {tool.fields.map((f) => (
                            <td key={f.key} className={f.wide ? "wide" : ""}>
                              <Input f={f} value={r.data[f.key]} form={formId} />
                              <Shown f={f} value={r.data[f.key]} />
                            </td>
                          ))}
                          <td className="row-actions">
                            <form id={formId} action={savePlanItem}>
                              {hidden}
                              <input type="hidden" name="tool" value={tool.key} />
                              <input type="hidden" name="item_id" value={r.id} />
                              <button className="btn small">Save</button>
                            </form>
                            <form action={deletePlanItem}>
                              {hidden}
                              <input type="hidden" name="item_id" value={r.id} />
                              <button className="linkbtn small" aria-label="Remove row">Remove</button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </PlanGroup>
                ))}
                <tr className="add-row">
                  {tool.fields.map((f) => (
                    <td key={f.key} className={f.wide ? "wide" : ""}>
                      <Input f={f} value={f.type === "select" && f.key === tool.groupBy ? "" : undefined} form="row-new" />
                    </td>
                  ))}
                  <td className="row-actions">
                    <form id="row-new" action={savePlanItem}>
                      {hidden}
                      <input type="hidden" name="tool" value={tool.key} />
                      <button className="btn small">Add</button>
                    </form>
                  </td>
                </tr>
              </tbody>
              {tool.totals && rows.length > 0 && (
                <tfoot>
                  <tr>
                    {tool.fields.map((f) => (
                      <td key={f.key} className="num">
                        {tool.totals!.includes(f.key) ? (
                          tool.key === "budget" ? (
                            <span className="small">
                              Spend {fmtMoney(sum(expenses, f.key))}
                              <br />
                              Funding {fmtMoney(sum(funding, f.key))}
                            </span>
                          ) : (
                            <strong>{fmtMoney(sum(rows, f.key))}</strong>
                          )
                        ) : f === tool.fields[0] ? <strong>Totals</strong> : null}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {tool.starter && (
            <form action={addStarterRows}>
              {hidden}
              <input type="hidden" name="tool" value={tool.key} />
              <button className="btn ghost small">{rows.length ? "Add the starter rows again" : `Start with ${tool.starter.length} suggested rows`}</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function PlanGroup({ label, cols, children }: { label: string; cols: number; children: React.ReactNode }) {
  return (
    <>
      {label && (
        <tr className="group-row">
          <th colSpan={cols}>{label}</th>
        </tr>
      )}
      {children}
    </>
  );
}
