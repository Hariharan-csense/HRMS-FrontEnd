import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import ENDPOINTS from "@/lib/endpoint";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { departmentApi } from "@/components/helper/department/department";
import { designationApi } from "@/components/helper/designation/designation";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, MessageCircle } from "lucide-react";

type RecipientType = "all" | "department" | "designation" | "employee";

type SimpleEmployee = {
  id: string;
  label: string;
};

type SurveyTemplate = {
  id: number;
  name: string;
  title: string;
  message: string;
  whatsappLanguage?: string;
  whatsappButtons?: Array<{ id: string; label: string; score: number }>;
};

const EmployeeCombobox: React.FC<{
  value: string;
  options: SimpleEmployee[];
  disabled?: boolean;
  onChange: (id: string) => void;
}> = ({ value, options, disabled, onChange }) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.id === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-10 w-full justify-between border-gray-300 text-sm"
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {disabled ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{selectedLabel || "Loading..."}</span>
              </div>
            ) : (
              selectedLabel || "Select employee"
            )}
          </span>
          {!disabled && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search employee..." className="h-9" />
          <CommandList className="max-h-56">
            <CommandEmpty>No employee found.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === o.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const CreatePulseSurvey: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("How happy are you at work today?");
  const [message, setMessage] = useState("On a scale of 1-10, how happy are you with your work today? Share your feedback to help us improve your workplace experience.");
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);
  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [designations, setDesignations] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ENDPOINTS.getPulseSurveyTemplates({ active: true });
        if (cancelled) return;
        setTemplates(Array.isArray(res.data) ? res.data : []);
      } catch {
        // Non-blocking: templates are optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingRecipients(true);
      try {
        const [deptRes, desigRes, empRes] = await Promise.all([
          departmentApi.getdepartment(),
          designationApi.getDesignations(),
          ENDPOINTS.getEmployee(),
        ]);

        if (cancelled) return;

        setDepartments(
          (deptRes.data || []).map((d) => ({ id: d.id, name: d.name })),
        );
        setDesignations(
          (desigRes.data || []).map((d) => ({ id: d.id, name: d.name })),
        );

        const raw = empRes?.data;
        const list: any[] =
          Array.isArray(raw) ? raw :
            Array.isArray(raw?.employees) ? raw.employees :
              Array.isArray(raw?.data) ? raw.data :
                [];

        const mapped: SimpleEmployee[] = list.map((e: any) => {
          const first = e.first_name || e.firstName || "";
          const last = e.last_name || e.lastName || "";
          const name = `${first} ${last}`.trim() || e.name || e.full_name || e.fullName || e.email || "Employee";
          const empCode = e.employee_id || e.employeeId || e.employee_code || "";
          const label = empCode ? `${name} (${empCode})` : `${name} (#${e.id})`;
          return { id: String(e.id), label };
        });

        setEmployees(mapped);
      } catch {
        // Non-blocking: fallback to empty lists (manual selection not allowed here)
      } finally {
        if (!cancelled) setLoadingRecipients(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    setSelectedDepartmentId("");
    setSelectedDesignationId("");
    setSelectedEmployeeId("");
  }, [recipientType]);

  const onSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle) {
      toast({
        title: "Survey title required",
        description: "Please enter a survey title.",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === "department" && !selectedDepartmentId) {
      toast({
        title: "Recipient required",
        description: "Please select a department.",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === "designation" && !selectedDesignationId) {
      toast({
        title: "Recipient required",
        description: "Please select a designation.",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === "employee" && !selectedEmployeeId) {
      toast({
        title: "Recipient required",
        description: "Please select an employee.",
        variant: "destructive",
      });
      return;
    }

    if (sendViaWhatsApp && !templateId) {
      toast({
        title: "WhatsApp template required",
        description: "Select a Pulse Survey template to send via WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: trimmedTitle,
        message: trimmedMessage,
        recipientType,
        allowAnonymous,
        templateId: templateId ? Number(templateId) : undefined,
        sendViaWhatsApp,
      };

      if (recipientType === "employee") payload.selectedEmployeeIds = [selectedEmployeeId];
      if (recipientType === "department") payload.selectedDepartment = [selectedDepartmentId];
      if (recipientType === "designation") payload.selectedDesignation = [selectedDesignationId];

      const res = await ENDPOINTS.createPulseSurvey(payload);
      const totalSent = Number(res?.data?.totalSent || 0);
      const emailSent = Number(res?.data?.emails?.sent || 0);
      const emailFailed = Number(res?.data?.emails?.failed || 0);
      const pushSent = Number(res?.data?.push?.sent || 0);
      const pushFailed = Number(res?.data?.push?.failed || 0);
      const pushSkipped = Number(res?.data?.push?.skipped || 0);
      const whatsappSent = Number(res?.data?.whatsapp?.sent || 0);
      const whatsappFailed = Number(res?.data?.whatsapp?.failed || 0);
      const pushSkipReasons = Array.isArray(res?.data?.push?.skipReasons)
        ? res.data.push.skipReasons
        : [];
      const pushErrorReason = res?.data?.push?.errors?.[0]?.reason;
      const pushSkipHint = pushSkipReasons.includes("fcm_api_permission_denied") ||
        pushErrorReason === "fcm_api_permission_denied"
        ? " — enable Firebase Cloud Messaging API and grant the service account permission to send messages"
        : pushSkipReasons.includes("no_active_fcm_token")
          ? " — assignee must log in on browser and allow notifications"
          : pushSkipReasons.includes("firebase_not_configured")
            ? " — configure Firebase Admin on the server"
            : pushSkipReasons.includes("fcm_credential_mismatch")
              ? " — regenerate Web Push key in Firebase and re-login on browser"
              : "";

      toast({
        title: "Survey sent",
        description: totalSent
          ? `Survey assigned to ${totalSent} employee(s). WhatsApp sent: ${whatsappSent}${whatsappFailed ? `, failed: ${whatsappFailed}` : ""}. Push sent: ${pushSent}${pushFailed ? `, failed: ${pushFailed}` : ""}${pushSkipped ? `, skipped: ${pushSkipped}` : ""}${pushSkipHint}. Emails sent: ${emailSent}${emailFailed ? `, failed: ${emailFailed}` : ""}.`
          : "Survey created successfully.",
      });

      navigate("/pulse-surveys/dashboard");
    } catch (e: any) {
      toast({
        title: "Failed",
        description:
          e?.response?.data?.message || e?.message || "Failed to create survey",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="pulse-theme w-full min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 sm:p-6">
        <Card className="mx-auto max-w-5xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white">
            <div className="text-xl font-bold">Create &amp; Send Survey</div>
            <div className="mt-1 text-sm text-emerald-50">
              Send a happiness survey to your team
            </div>
          </div>

          <CardContent className="space-y-5 p-5">
            <div className="max-w-2xl space-y-2">
              <Label className="text-sm font-semibold text-gray-900">Template (optional)</Label>
              <Select
                value={templateId}
                onValueChange={(v) => {
                  setTemplateId(v);
                  const t = templates.find((x) => String(x.id) === v);
                  if (t) {
                    setTitle(t.title || "");
                    setMessage(t.message || "");
                  }
                }}
              >
                <SelectTrigger className="h-10 border-gray-300 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                {templates.length === 0 ? (
                    <SelectItem value="none" disabled className="h-9 text-sm focus:bg-gray-100 focus:text-gray-900">
                      No templates
                    </SelectItem>
                  ) : (
                    templates.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)} className="h-9 text-sm focus:bg-gray-100 focus:text-gray-900">
                        {t.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Selecting a template will fill the title and message (you can still edit).
              </p>
            </div>

            <div className="max-w-2xl rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="send-whatsapp"
                  checked={sendViaWhatsApp}
                  onCheckedChange={(v) => setSendViaWhatsApp(Boolean(v))}
                  className="mt-0.5 border-emerald-500 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                />
                <div className="space-y-1">
                  <Label htmlFor="send-whatsapp" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <MessageCircle className="h-4 w-4 text-emerald-700" />
                    Send Survey via WhatsApp
                  </Label>
                  <p className="text-xs leading-5 text-gray-600">
                    Sends the survey with a tappable emoji-rating link. Any quick-reply buttons in the approved WhatsApp template may also remain visible.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,640px)_320px]">
              <div className="space-y-2">
                <Label htmlFor="survey-title" className="text-sm font-semibold text-gray-900">Survey Title</Label>
                <Input
                  id="survey-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Are you happy?"
                  className="h-10 border-gray-300 text-sm text-gray-900 focus-visible:ring-gray-500"
                />
              </div>

              <div className="flex items-start gap-3 self-end rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <Checkbox
                  id="allow-anon"
                  checked={allowAnonymous}
                  onCheckedChange={(v) => setAllowAnonymous(Boolean(v))}
                  className="mt-0.5 border-gray-400 data-[state=checked]:border-gray-900 data-[state=checked]:bg-gray-900"
                />
                <div className="space-y-1">
                  <Label htmlFor="allow-anon" className="text-sm font-semibold text-gray-900">Allow anonymous responses</Label>
                  <p className="text-xs leading-5 text-gray-500">
                    Employees can choose to submit responses anonymously
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-4xl space-y-2">
              <Label htmlFor="survey-message" className="text-sm font-semibold text-gray-900">Message</Label>
              <Textarea
                id="survey-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={"How happy are you at work today? (1-10)\nTell us what could improve..."}
                className="min-h-[92px] resize-y border-gray-300 text-sm text-gray-900 focus-visible:ring-gray-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-900">Send To</Label>
                {loadingRecipients ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading recipients...
                  </div>
                ) : null}
              </div>
              <RadioGroup
                value={recipientType}
                onValueChange={(v) => setRecipientType(v as RecipientType)}
                className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
              >
                {[
                  { value: "all", label: "All Employees" },
                  { value: "department", label: "Specific Department" },
                  { value: "designation", label: "Specific Designation" },
                  { value: "employee", label: "Specific Employee" },
                ].map((opt) => (
                  <Label
                    key={opt.value}
                    htmlFor={`send-${opt.value}`}
                    className={cn(
                      "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 transition-colors",
                      recipientType === opt.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:bg-emerald-50/50",
                    )}
                  >
                    <RadioGroupItem
                      value={opt.value}
                      id={`send-${opt.value}`}
                      className="border-gray-400 text-gray-900"
                    />
                    <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                  </Label>
                ))}
              </RadioGroup>

              {recipientType !== "all" && (
                <div className="max-w-2xl space-y-2 pt-2">
                  <Label className="text-sm font-semibold text-gray-900">Recipient</Label>

                  {recipientType === "department" ? (
                    <Select
                      value={selectedDepartmentId}
                      onValueChange={setSelectedDepartmentId}
                      disabled={loadingRecipients}
                    >
                      <SelectTrigger className="h-10 border-gray-300 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500">
                        <SelectValue placeholder={loadingRecipients ? "Loading..." : "Select department"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="h-9 text-sm focus:bg-gray-100 focus:text-gray-900">
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}

                  {recipientType === "designation" ? (
                    <Select
                      value={selectedDesignationId}
                      onValueChange={setSelectedDesignationId}
                      disabled={loadingRecipients}
                    >
                      <SelectTrigger className="h-10 border-gray-300 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500">
                        <SelectValue placeholder={loadingRecipients ? "Loading..." : "Select designation"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {designations.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="h-9 text-sm focus:bg-gray-100 focus:text-gray-900">
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}

                  {recipientType === "employee" ? (
                    <EmployeeCombobox
                      value={selectedEmployeeId}
                      options={employees}
                      disabled={loadingRecipients}
                      onChange={setSelectedEmployeeId}
                    />
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-end gap-3 border-t border-gray-200 pt-4 sm:flex-row">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/pulse-surveys/dashboard")}
                disabled={submitting}
                className="h-10 border-gray-300 px-5 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                className="h-10 bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-sm text-white hover:from-emerald-700 hover:to-teal-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {sendViaWhatsApp ? "Sending via WhatsApp..." : "Sending..."}
                  </>
                ) : (
                  sendViaWhatsApp ? "Send Survey via WhatsApp" : "Send Survey"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreatePulseSurvey;
