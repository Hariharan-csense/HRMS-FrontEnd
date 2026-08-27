import React, { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HelpCircle, Plus, RefreshCw } from "lucide-react";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "sonner";

const categories = [
  { value: "pf_issue", label: "PF Issue" },
  { value: "salary_query", label: "Salary Query" },
  { value: "asset_issue", label: "Asset Issue" },
  { value: "leave_balance_issue", label: "Leave Balance Issue" },
  { value: "policy_query", label: "Policy Query" },
  { value: "general", label: "General" },
];

const HRHelpdesk: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [assignees, setAssignees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category: "salary_query",
    priority: "medium",
    subject: "",
    description: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketResponse, assigneeResponse] = await Promise.all([
        ENDPOINTS.getHrHelpdeskTickets(),
        ENDPOINTS.getHrHelpdeskAssignees().catch(() => ({ data: { data: [] } })),
      ]);
      setTickets(ticketResponse.data?.data || []);
      setStats(ticketResponse.data?.stats || {});
      setAssignees(assigneeResponse.data?.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load HR helpdesk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createTicket = async () => {
    if (!form.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    try {
      await ENDPOINTS.createHrHelpdeskTicket(form);
      toast.success("HR helpdesk ticket created");
      setOpen(false);
      setForm({ category: "salary_query", priority: "medium", subject: "", description: "" });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create ticket");
    }
  };

  const updateTicket = async (id: string, data: any) => {
    try {
      await ENDPOINTS.updateHrHelpdeskTicket(id, data);
      toast.success("Ticket updated");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update ticket");
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <HelpCircle className="h-7 w-7 shrink-0 text-primary sm:h-8 sm:w-8" />
              HR Helpdesk
            </h1>
            <p className="text-muted-foreground mt-2">
              Raise PF, salary, asset, leave balance, and policy queries with SLA tracking.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button className="w-full sm:w-auto" variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Raise Query
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Total", stats.total || 0],
            ["Open", stats.open || 0],
            ["Assigned", stats.assigned || 0],
            ["In Progress", stats.in_progress || 0],
            ["Resolved", stats.resolved || 0],
            ["Overdue", stats.overdue || 0],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-4 sm:pt-5">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>HR Queries</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-3 sm:hidden">
              {tickets.length === 0 ? (
                <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
                  No HR helpdesk tickets found
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="space-y-4 rounded-lg border p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold break-words">{ticket.ticketNumber}</div>
                        <div className="mt-1 text-sm text-muted-foreground break-words">{ticket.subject}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                        {String(ticket.status || "open").replace(/_/g, " ")}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">Employee</dt>
                        <dd className="mt-1 break-words">{ticket.employeeName || "-"}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">Category</dt>
                        <dd className="mt-1 break-words">{ticket.categoryLabel || ticket.category}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Priority</dt>
                        <dd className="mt-1 capitalize">{ticket.priority}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">SLA Due</dt>
                        <dd className="mt-1">{ticket.dueAt ? new Date(ticket.dueAt).toLocaleString() : "-"}</dd>
                      </div>
                    </dl>

                    <div className="grid gap-3">
                      <label className="grid gap-1.5 text-xs text-muted-foreground">
                        Assigned HR
                        <select
                          className="h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm text-foreground"
                          value={ticket.assignedHrId || ""}
                          onChange={(event) => {
                            const user = assignees.find(
                              (assignee) => String(assignee.id) === event.target.value,
                            );
                            updateTicket(String(ticket.id), {
                              assignedHrId: event.target.value,
                              assignedHrName: user?.name || user?.email || "",
                              status: ticket.status === "open" ? "assigned" : ticket.status,
                            });
                          }}
                        >
                          <option value="">Unassigned</option>
                          {assignees.map((assignee) => (
                            <option key={assignee.id} value={assignee.id}>
                              {assignee.name || assignee.email}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs text-muted-foreground">
                        Status
                        <select
                          className="h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm text-foreground"
                          value={ticket.status}
                          onChange={(event) =>
                            updateTicket(String(ticket.id), { status: event.target.value })
                          }
                        >
                          <option value="open">Open</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden overflow-x-auto rounded-md border sm:block">
              <table className="min-w-[1040px] w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="whitespace-nowrap p-3 text-left">Ticket</th>
                    <th className="whitespace-nowrap p-3 text-left">Employee</th>
                    <th className="whitespace-nowrap p-3 text-left">Category</th>
                    <th className="whitespace-nowrap p-3 text-left">Priority</th>
                    <th className="whitespace-nowrap p-3 text-left">Assigned HR</th>
                    <th className="whitespace-nowrap p-3 text-left">SLA Due</th>
                    <th className="whitespace-nowrap p-3 text-left">Status</th>
                    <th className="whitespace-nowrap p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground">
                        No HR helpdesk tickets found
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">{ticket.ticketNumber}</div>
                          <div className="text-xs text-muted-foreground">{ticket.subject}</div>
                        </td>
                        <td className="p-3">{ticket.employeeName || "-"}</td>
                        <td className="p-3">{ticket.categoryLabel || ticket.category}</td>
                        <td className="p-3">{ticket.priority}</td>
                        <td className="p-3">
                          <select
                            className="h-9 rounded-md border bg-background px-2"
                            value={ticket.assignedHrId || ""}
                            onChange={(event) => {
                              const user = assignees.find(
                                (assignee) => String(assignee.id) === event.target.value,
                              );
                              updateTicket(String(ticket.id), {
                                assignedHrId: event.target.value,
                                assignedHrName: user?.name || user?.email || "",
                                status: ticket.status === "open" ? "assigned" : ticket.status,
                              });
                            }}
                          >
                            <option value="">Unassigned</option>
                            {assignees.map((assignee) => (
                              <option key={assignee.id} value={assignee.id}>
                                {assignee.name || assignee.email}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          {ticket.dueAt ? new Date(ticket.dueAt).toLocaleString() : "-"}
                        </td>
                        <td className="p-3">{ticket.status}</td>
                        <td className="p-3">
                          <select
                            className="h-9 rounded-md border bg-background px-2"
                            value={ticket.status}
                            onChange={(event) =>
                              updateTicket(String(ticket.id), { status: event.target.value })
                            }
                          >
                            <option value="open">Open</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Raise HR Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3"
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
                placeholder="Example: PF number not updated"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Explain the issue"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createTicket}>Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default HRHelpdesk;
