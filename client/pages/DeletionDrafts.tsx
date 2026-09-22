import { useCallback, useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/endpoint";
import { toast } from "sonner";
import { ArchiveRestore, RefreshCw } from "lucide-react";

type Draft = {
  id: number;
  entity: string;
  record_id: string;
  record_label: string;
  company_id: number | null;
  record_code?: string | null;
  employee_code?: string | null;
  status: string;
  requested_by_name: string;
  created_at: string;
  reason?: string;
  reviewed_by_name?: string;
  review_note?: string;
  restored_by_name?: string;
  summary: {
    deletedRecords: number;
    updatedRecords: number;
    tables: Record<string, number>;
  };
};
type Action = "approve" | "reject" | "cancel" | "restore";
const labels: Record<Action, string> = {
  approve: "Approve deletion",
  reject: "Reject request",
  cancel: "Cancel request",
  restore: "Restore record",
};

export default function DeletionDrafts() {
  const [rows, setRows] = useState<Draft[]>([]);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canApprove, setCanApprove] = useState(false);
  const [canRestore, setCanRestore] = useState(false);
  const [selection, setSelection] = useState<{
    row: Draft;
    action: Action;
  } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/deletion-drafts", {
        params: { status, page },
      });
      setRows(data.data);
      setTotal(data.total);
      setCanApprove(data.canApprove);
      setCanRestore(data.canRestore);
    } catch (cause: any) {
      setRows([]);
      setCanApprove(false);
      setCanRestore(false);
      setError(
        cause.response?.data?.message || "Could not load deletion drafts",
      );
    } finally {
      setLoading(false);
    }
  }, [status, page]);
  useEffect(() => {
    void load();
  }, [load]);
  const act = async () => {
    if (!selection || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(
        `/deletion-drafts/${selection.row.id}/${selection.action}`,
        { note },
      );
      toast.success(data.message);
      setSelection(null);
      setNote("");
      await load();
    } catch (cause: any) {
      toast.error(
        cause.response?.data?.message || "Could not complete this action",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ArchiveRestore />
              Deletion Drafts
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Records stay active while awaiting CEO approval. Admin can cancel
              a pending request or restore an approved deletion.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="draft-status">Status</label>
          <select
            id="draft-status"
            className="rounded border bg-background p-2"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="pending">Awaiting CEO approval</option>
            <option value="deleted">Deleted — available to restore</option>
            <option value="restored">Restored</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="all">All</option>
          </select>
        </div>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {loading ? (
          <p role="status">Loading deletion drafts…</p>
        ) : !error && rows.length === 0 ? (
          <p>No deletion drafts in this status.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <article
                key={row.id}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{row.record_label}</h2>
                    <p className="text-sm text-muted-foreground">
                      {row.entity.replace(/_/g, " ")} ·{" "}
                      {row.entity === "employee"
                        ? `Employee code ${row.employee_code || row.record_id}`
                        : `ID ${row.record_id}`}{" "}
                      · Request #{row.id}
                    </p>
                  </div>
                  <span className="text-sm font-medium capitalize">
                    {row.status === "pending"
                      ? canApprove
                        ? "Pending your approval"
                        : "Awaiting CEO approval"
                      : row.status}
                  </span>
                </div>
                <p className="text-sm">
                  Requested by {row.requested_by_name} on{" "}
                  {new Date(row.created_at).toLocaleString()}
                </p>
                {row.reason && <p className="text-sm">Reason: {row.reason}</p>}
                <details className="text-sm">
                  <summary className="cursor-pointer">
                    Affected data: {row.summary.deletedRecords} records,{" "}
                    {row.summary.updatedRecords} linked changes
                  </summary>
                  <ul className="list-disc pl-5 mt-2">
                    {Object.entries(row.summary.tables).map(
                      ([table, count]) => (
                        <li key={table}>
                          {table.replace(/_/g, " ")}: {count}
                        </li>
                      ),
                    )}
                  </ul>
                </details>
                {row.reviewed_by_name && (
                  <p className="text-sm text-muted-foreground">
                    Reviewed by {row.reviewed_by_name}
                    {row.review_note ? ` — ${row.review_note}` : ""}
                  </p>
                )}
                {row.restored_by_name && (
                  <p className="text-sm text-muted-foreground">
                    Restored by {row.restored_by_name}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ...(row.status === "pending" && canApprove
                        ? ["approve", "reject"]
                        : []),
                      ...(row.status === "pending" && canRestore
                        ? ["cancel"]
                        : []),
                      ...(row.status === "deleted" && canRestore
                        ? ["restore"]
                        : []),
                    ] as Action[]
                  ).map((action) => (
                    <Button
                      key={action}
                      variant={action === "approve" ? "destructive" : "outline"}
                      onClick={() => {
                        setSelection({ row, action });
                        setNote("");
                      }}
                    >
                      {labels[action]}
                    </Button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} · {total} requests
          </span>
          <Button
            variant="outline"
            disabled={page * 50 >= total || loading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
        <Dialog
          open={!!selection}
          onOpenChange={(open) => {
            if (!open && !busy) setSelection(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selection && labels[selection.action]}</DialogTitle>
              <DialogDescription>
                {selection?.row.record_label}.{" "}
                {selection?.action === "approve"
                  ? "This removes the record and the listed dependent data from active use. Admin can restore the archive."
                  : selection?.action === "restore"
                    ? "Restore the archived record and linked data. Existing records will not be overwritten."
                    : "The original record will remain active."}
              </DialogDescription>
            </DialogHeader>
            {selection?.action !== "restore" && (
              <label className="space-y-2">
                Review note (optional)
                <textarea
                  className="w-full rounded border p-2 bg-background"
                  maxLength={2000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setSelection(null)}
              >
                Back
              </Button>
              <Button
                disabled={busy}
                variant={
                  selection?.action === "approve" ? "destructive" : "default"
                }
                onClick={() => void act()}
              >
                {busy ? "Working…" : selection && labels[selection.action]}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
