import React from "react";

type ReviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

type ReviewRow = {
  id: number;
  feedback?: string | null;
  targetDate?: string | null;
  status?: ReviewStatus | null;
  kpiParameter?: { name?: string | null } | null;
};

type StatusOption = { value: ReviewStatus; label: string };

type Props = {
  rows: ReviewRow[];
  ownerName: (row: ReviewRow) => string;
  displayDate: (value?: string | null) => string;
  feedbackLabel: string;
  statusOptions: StatusOption[];
  canEditStatus: boolean;
  savingId: number | null;
  onStatusChange: (id: number, status: ReviewStatus) => void;
  loading: boolean;
  emptyMessage: string;
};

export function KpiParameterReviewMobileList({
  rows,
  ownerName,
  displayDate,
  feedbackLabel,
  statusOptions,
  canEditStatus,
  savingId,
  onStatusChange,
  loading,
  emptyMessage,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 md:hidden">
        Loading...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 md:hidden">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row, index) => (
        <article
          key={row.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">#{index + 1}</p>
              <p className="truncate text-base font-semibold text-slate-900">
                {ownerName(row)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {row.kpiParameter?.name ?? "-"}
              </p>
            </div>
            <select
              value={row.status ?? "PENDING"}
              disabled={!canEditStatus || savingId === row.id}
              onChange={(event) =>
                onStatusChange(row.id, event.target.value as ReviewStatus)
              }
              className="relative z-10 max-w-[9.5rem] shrink-0 rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {feedbackLabel}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">
                {row.feedback || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Target Date
              </p>
              <p className="mt-1 text-slate-700">
                {displayDate(row.targetDate)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
