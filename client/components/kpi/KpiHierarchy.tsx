import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/endpoint";
import { useRole } from "@/context/RoleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Node = {
  id: number;
  name: string;
  designation: string;
  department: string;
  branch: string;
  score: number | null;
  scoreType: "manual" | "auto_average";
  scoreSource?: "scorecard";
  parentEmployeeId: number | null;
  children: Node[];
};
type Result = {
  tree: Node[];
  ownerEmployeeId: number | null;
  parameters: { id: number; name: string }[];
  canManageHierarchy: boolean;
};
const message = (error: any) =>
  error?.response?.data?.message || "Unable to load or save KPI hierarchy.";
const fieldClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100";

export default function KpiHierarchy({ revision, savedScorecard }: {
  revision: unknown;
  savedScorecard?: { id: string; year: number; month: number } | null;
}) {
  const { canPerformModuleAction } = useRole();
  const [templates, setTemplates] = useState<
    {
      id: number;
      title: string | null;
      ownerName: string;
      parameterNames: string[];
      year: number;
      month: number;
    }[]
  >([]);
  const [templateId, setTemplateId] = useState("");
  const [parameterId, setParameterId] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const version = useRef(0);
  const canEdit = canPerformModuleAction("kpi", "update", "scorecard");
  const canManage =
    result?.canManageHierarchy &&
    canPerformModuleAction("employees", "update", "profile");

  useEffect(() => {
    const controller = new AbortController();
    setLoadingTemplates(true);
    setError("");
    api
      .get("/kpi/hierarchy/templates", { signal: controller.signal })
      .then(({ data }) => {
        setTemplates(data);
        setLoadingTemplates(false);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(message(e));
          setLoadingTemplates(false);
        }
      });
    return () => controller.abort();
  }, [retry, revision, savedScorecard]);

  useEffect(() => {
    if (!savedScorecard) return;
    setTemplateId(String(savedScorecard.id));
    setYear(String(savedScorecard.year));
    setMonth(String(savedScorecard.month));
    setParameterId("");
  }, [savedScorecard]);

  useEffect(() => {
    const current = ++version.current;
    if (!templateId) {
      setResult(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setResult(null);
    api
      .get("/kpi/hierarchy", {
        params: { templateId, parameterId, year, month },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (current === version.current) setResult(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      })
      .finally(() => {
        if (current === version.current) setLoading(false);
      });
    return () => controller.abort();
  }, [templateId, parameterId, year, month, retry, revision, savedScorecard]);

  async function save(
    id: number,
    kind: "score" | "parent",
    value: number | null,
  ) {
    setSaving(true);
    setError("");
    const current = version.current;
    try {
      const { data } = await api.put(`/kpi/hierarchy/${id}/${kind}`, {
        templateId,
        parameterId,
        year,
        month,
        ...(kind === "score" ? { score: value } : { parentEmployeeId: value }),
      });
      if (current === version.current) setResult(data);
    } catch (e) {
      setError(message(e));
    } finally {
      setSaving(false);
    }
  }

  const flattened: { node: Node; depth: number }[] = [];
  const stack = [...(result?.tree || [])]
    .reverse()
    .map((node) => ({ node, depth: 0 }));
  while (stack.length) {
    const item = stack.pop()!;
    flattened.push(item);
    for (const node of [...item.node.children].reverse())
      stack.push({ node, depth: item.depth + 1 });
  }

  const selectedRows = flattened.filter(({ node }) => node.id === result?.ownerEmployeeId);

  return (
    <details open className="group mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 [&::-webkit-details-marker]:hidden">
        <h2 className="text-lg font-semibold text-slate-900">KPI hierarchy</h2>
        <span className="text-sm font-medium text-teal-700"><span className="group-open:hidden">Expand +</span><span className="hidden group-open:inline">Collapse −</span></span>
      </summary>
      <p className="mt-1 text-sm text-slate-500">
        Saved achievement-based KPI scores appear automatically for the selected
        scorecard. Edit its achievement to change a score marked "From scorecard".
        Each manager averages available scores from direct reports.
      </p>
      <fieldset
        disabled={saving}
        className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,2fr)_minmax(180px,1fr)_100px_160px_auto]"
      >
        <label className="grid min-w-0 gap-1 text-sm">
          Template
          <HierarchySelect
            label="Template"
            value={templateId}
            disabled={saving}
            onChange={(value) => {
              setTemplateId(value);
              setParameterId("");
              const template = templates.find((t) => String(t.id) === value);
              if (template) {
                setYear(String(template.year));
                setMonth(String(template.month));
              }
            }}
            placeholder="Select a template"
            options={templates.map((t) => ({
              value: String(t.id),
              label: `${t.ownerName || "Unassigned owner"} — ${(t.parameterNames || []).join(", ") || t.title || "KPI Scorecard"} · ${new Date(t.year, t.month - 1, 1).toLocaleString(undefined, { month: "short", year: "numeric" })}`,
            }))}
          />
        </label>
        <label className="grid min-w-0 gap-1 text-sm">
          Parameter
          <HierarchySelect
            label="Parameter"
            value={parameterId}
            disabled={saving || !result}
            onChange={setParameterId}
            options={[
              { value: "", label: "All parameters" },
              ...(result?.parameters || []).map((p) => ({
                value: String(p.id),
                label: p.name,
              })),
            ]}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Year
          <input
            className={`${fieldClass} w-24`}
            type="number"
            min="1"
            max="9999"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Month
          <HierarchySelect
            label="Month"
            value={month}
            disabled={saving}
            onChange={setMonth}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: String(i + 1),
              label: new Date(2000, i, 1).toLocaleString(undefined, {
                month: "long",
              }),
            }))}
          />
        </label>
        <button
          type="button"
          className={`${fieldClass} self-end`}
          onClick={() => setRetry((n) => n + 1)}
        >
          Refresh
        </button>
      </fieldset>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {!loading &&
        !loadingTemplates &&
        result &&
        selectedRows.length > 0 &&
        !selectedRows.some(({ node }) => node.score !== null) && (
          <p
            role="status"
            className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
          >
            No scores entered for this template and period. Existing scores
            belong to their original template and month. Select a parameter to
            enter a score; missing scores are excluded from parent averages.
          </p>
        )}
      {loading || loadingTemplates ? (
        <p role="status" className="mt-4 text-sm">
          Loading hierarchy…
        </p>
      ) : !templateId ? (
        <p className="mt-4 text-sm">
          {templates.length
            ? "Select a template to view the reporting hierarchy."
            : "No KPI templates available. Create a scorecard first."}
        </p>
      ) : result && !selectedRows.length ? (
        <p className="mt-4 text-sm">
          The selected template owner is unavailable or outside your access scope.
        </p>
      ) : (
        result && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {[
                    "Employee",
                    "Designation",
                    "Department",
                    "Branch",
                    "Score",
                    "Score type",
                    ...(canManage ? ["Reporting manager"] : []),
                  ].map((label) => (
                    <th key={label} className="p-2">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedRows.map(({ node }) => (
                  <tr key={node.id} className="border-t border-slate-200">
                    <td className="p-2">
                      <span
                        className="whitespace-nowrap"
                      >
                        {node.name}
                      </span>
                    </td>
                    <td className="p-2">{node.designation || "—"}</td>
                    <td className="p-2">{node.department || "—"}</td>
                    <td className="p-2">{node.branch || "—"}</td>
                    <td className="p-2">
                      <ScoreInput
                        key={`${node.id}:${node.score}:${parameterId}`}
                        node={node}
                        editable={
                          canEdit &&
                          !!parameterId &&
                          node.scoreSource !== "scorecard" &&
                          node.scoreType === "manual"
                        }
                        disabled={saving}
                        onSave={(value) => save(node.id, "score", value)}
                      />
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {node.scoreType === "auto_average"
                        ? "Auto average"
                        : node.scoreSource === "scorecard" ? "From scorecard" : "Manual"}
                    </td>
                    {canManage && (
                      <td className="p-2">
                        <div className="w-56 max-w-full">
                          <HierarchySelect
                            label={`Reporting manager for ${node.name}`}
                            disabled={saving}
                            value={
                              node.parentEmployeeId == null
                                ? ""
                                : String(node.parentEmployeeId)
                            }
                            onChange={(value) =>
                              save(
                                node.id,
                                "parent",
                                value ? Number(value) : null,
                              )
                            }
                            options={[
                              { value: "", label: "No manager" },
                              ...flattened
                                .filter((item) => item.node.id !== node.id)
                                .map(({ node: manager }) => ({
                                  value: String(manager.id),
                                  label: manager.name,
                                })),
                            ]}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {saving && (
        <p role="status" className="mt-3 text-sm">
          Saving and recalculating parent scores…
        </p>
      )}
    </details>
  );
}

function HierarchySelect({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}) {
  const emptyValue = "__none__";
  return (
    <Select
      value={value || (options.some((o) => o.value === "") ? emptyValue : "")}
      onValueChange={(next) => onChange(next === emptyValue ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={label}
        className={`${fieldClass} h-11 min-w-0 text-left [&>span]:truncate`}
        title={options.find((o) => o.value === value)?.label}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={4}
        collisionPadding={16}
        className="max-h-[min(18rem,var(--radix-select-content-available-height))]"
        viewportClassName="!h-auto max-h-[min(16rem,var(--radix-select-content-available-height))]"
      >
        {options.map((option) => (
          <SelectItem
            key={option.value || emptyValue}
            value={option.value || emptyValue}
            textValue={option.label}
            className="py-2 [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words"
            title={option.label}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ScoreInput({
  node,
  editable,
  disabled,
  onSave,
}: {
  node: Node;
  editable: boolean;
  disabled: boolean;
  onSave: (score: number | null) => Promise<void>;
}) {
  const [value, setValue] = useState(
    node.score === null ? "" : String(node.score),
  );
  if (!editable)
    return (
      <input
        aria-label={`Score for ${node.name}`}
        className={`${fieldClass} w-28`}
        readOnly
        disabled
        value={node.score === null ? "—" : Number(node.score.toFixed(4))}
      />
    );
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(value.trim() === "" ? null : Number(value));
      }}
    >
      <input
        aria-label={`Score for ${node.name}`}
        className={`${fieldClass} w-28`}
        type="number"
        step="0.0001"
        min="-99999999.9999"
        max="99999999.9999"
        disabled={disabled}
        value={value}
        placeholder="No score"
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        className="rounded-lg bg-teal-600 px-3 py-2 text-white disabled:opacity-50"
        disabled={disabled}
        type="submit"
      >
        Save
      </button>
    </form>
  );
}
