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
      <div className="rounded-2xl border border-[#bdf4df] bg-[#f3fdf9] px-4 py-8 text-center text-sm text-[#0f8f70] md:hidden">
        Loading...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#bdf4df] bg-[#f3fdf9] px-4 py-8 text-center text-sm text-[#0f8f70] md:hidden">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row, index) => (
        <article
          key={row.id}
          className="rounded-2xl border border-[#bdf4df] bg-white p-4 shadow-[0_12px_30px_rgba(23,196,145,0.12)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#0f8f70]">#{index + 1}</p>
              <p className="truncate text-base font-semibold text-[#053b2e]">
                {ownerName(row)}
              </p>
              <p className="mt-1 text-sm text-[#0f8f70]">
                {row.kpiParameter?.name ?? "-"}
              </p>
            </div>
            <select
              value={row.status ?? "PENDING"}
              disabled={!canEditStatus || savingId === row.id}
              onChange={(event) =>
                onStatusChange(row.id, event.target.value as ReviewStatus)
              }
              className="relative z-10 max-w-[9.5rem] shrink-0 rounded-xl border border-transparent bg-[#e9fbf5] px-2.5 py-2 text-xs font-semibold text-[#053b2e] outline-none focus:border-[#17c491] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 space-y-2 border-t border-[#e3faf2] pt-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-[#0f8f70]">
                {feedbackLabel}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[#053b2e]">
                {row.feedback || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0f8f70]">
                Target Date
              </p>
              <p className="mt-1 text-[#053b2e]">
                {displayDate(row.targetDate)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
