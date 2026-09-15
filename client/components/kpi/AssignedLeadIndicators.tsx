import React, { useEffect, useMemo, useState } from "react";
import { Target, X } from "lucide-react";
import { api } from "@/lib/endpoint";

type AssignedLeadIndicator = {
  parameterId: string;
  scorecardId: string;
  parameterName: string;
  scorecardOwner: string;
  uom: string;
  indicatorIndex: number;
  indicatorLabel: string;
  type: "number" | "yesno";
  targetValue: string;
  minimumValue: string;
  values: Record<string, string>;
  todayKey: string;
  todayValue: string;
  periodDate: string;
};

type IndicatorGroup = {
  key: string;
  parameterId: string;
  parameterName: string;
  scorecardOwner: string;
  uom: string;
  periodDate: string;
  items: AssignedLeadIndicator[];
};

const valueKey = (item: AssignedLeadIndicator, day: string) =>
  `${item.parameterId}-${item.indicatorIndex}-${day}`;

const periodDays = (periodDate?: string) => {
  const parsed = periodDate ? new Date(periodDate) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return Array.from(
    { length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() },
    (_, index) => ({ key: String(index + 1), label: String(index + 1).padStart(2, "0") }),
  );
};

const periodLabel = (periodDate?: string) => {
  const parsed = periodDate ? new Date(periodDate) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

export default function AssignedLeadIndicators() {
  const [items, setItems] = useState<AssignedLeadIndicator[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get("/kpi/scorecards/assigned-lead-indicators")
      .then(({ data }) => {
        if (!mounted) return;
        const assigned = Array.isArray(data) ? data : [];
        setItems(assigned);
        const next: Record<string, string> = {};
        assigned.forEach((item: AssignedLeadIndicator) => {
          Object.entries(item.values || {}).forEach(([day, value]) => {
            next[valueKey(item, day)] = String(value ?? "");
          });
        });
        setValues(next);
      })
      .catch((requestError) => {
        if (!mounted) return;
        const message = requestError?.response?.data?.message;
        setError(message || "Unable to load assigned lead indicators.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const groups = useMemo(() => {
    const grouped = new Map<string, IndicatorGroup>();
    items.forEach((item) => {
      const key = `${item.scorecardId}-${item.parameterId}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          parameterId: item.parameterId,
          parameterName: item.parameterName,
          scorecardOwner: item.scorecardOwner,
          uom: item.uom,
          periodDate: item.periodDate,
          items: [],
        });
      }
      grouped.get(key)?.items.push(item);
    });
    return [...grouped.values()];
  }, [items]);

  const activeGroup = groups.find((group) => group.key === activeKey) || null;

  const save = async () => {
    if (!activeGroup) return;
    setSaving(true);
    setError(null);
    try {
      const days = periodDays(activeGroup.periodDate);
      const responses = await Promise.all(
        activeGroup.items.map((item) =>
          api.patch(
            `/kpi/scorecards/assigned-lead-indicators/${item.parameterId}/${item.indicatorIndex}`,
            {
              dayKey: item.todayKey,
              values: Object.fromEntries(
                days.map((day) => [day.key, values[valueKey(item, day.key)] || ""]),
              ),
            },
          ),
        ),
      );
      setItems((current) =>
        current.map((item) => {
          const response = responses.find(
            ({ data }) =>
              String(data?.parameterId) === String(item.parameterId) &&
              Number(data?.indicatorIndex) === Number(item.indicatorIndex),
          );
          return response ? { ...item, values: response.data?.values || item.values } : item;
        }),
      );
      setActiveKey(null);
    } catch {
      setError("Unable to save assigned lead indicators.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading assigned lead indicators...</div>;
  }
  return (
    <>
      <section className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="rounded-t-2xl bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Target className="h-5 w-5 text-emerald-600" /> Assigned KPI Lead Indicators
          </h2>
          <p className="mt-1 text-sm text-slate-600">Update the indicators assigned to you.</p>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}
          {!error && !groups.length ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No lead indicators are assigned to this login.
            </div>
          ) : null}
          {groups.map((group) => (
            <div key={group.key} className="rounded-xl border border-emerald-100 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {periodLabel(group.periodDate)} · {group.uom || "UoM"}
              </p>
              <h3 className="mt-1 font-bold text-slate-900">{group.parameterName}</h3>
              <p className="mt-1 text-sm text-slate-500">{group.items.length} assigned indicator(s)</p>
              <button type="button" onClick={() => setActiveKey(group.key)} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Fill Indicators
              </button>
            </div>
          ))}
        </div>
      </section>

      {activeGroup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Assigned lead indicators</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{activeGroup.parameterName}</h2>
                <p className="text-xs text-slate-500">{periodLabel(activeGroup.periodDate)} · {activeGroup.uom || "UoM"}</p>
              </div>
              <button type="button" onClick={() => setActiveKey(null)} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <table className="min-w-[2460px] table-fixed border-collapse text-sm">
                <thead><tr className="bg-slate-50">
                  <th className="w-14 border p-2">S.No</th><th className="w-52 border p-2 text-left">Indicator</th><th className="w-24 border p-2">Type</th>
                  {periodDays(activeGroup.periodDate).map((day) => <th key={day.key} className="w-[70px] border p-2">{day.label}</th>)}
                </tr></thead>
                <tbody>{activeGroup.items.map((item, index) => (
                  <tr key={`${item.parameterId}-${item.indicatorIndex}`}>
                    <td className="border p-2 text-center">1.{index + 1}</td>
                    <td className="border p-3 font-medium">{item.indicatorLabel}{item.type === "number" ? <span className="mt-1 block text-xs font-normal text-slate-500">Target {item.targetValue || "-"} / Min {item.minimumValue || "-"}</span> : null}</td>
                    <td className="border p-2 text-center text-xs font-semibold uppercase">{item.type === "yesno" ? "Yes/No" : "Number"}</td>
                    {periodDays(activeGroup.periodDate).map((day) => {
                      const key = valueKey(item, day.key);
                      return <td key={key} className="border p-1">{item.type === "yesno" ? (
                        <select value={values[key] || ""} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="h-10 w-full rounded border px-1"><option value="" /><option value="Yes">Yes</option><option value="No">No</option></select>
                      ) : (
                        <input type="number" value={values[key] || ""} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="h-10 w-full rounded border px-2" />
                      )}</td>;
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 border-t p-4">
              <button type="button" onClick={() => setActiveKey(null)} className="rounded-lg border px-4 py-2 text-sm font-medium">Cancel</button>
              <button type="button" onClick={() => void save()} disabled={saving} className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save Lead Indicators"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
