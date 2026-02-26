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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

type RecipientType = "all" | "department" | "designation" | "employee";

type SimpleEmployee = {
  id: string;
  label: string;
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
          className="w-full justify-between h-11"
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {selectedLabel || "Select employee"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search employee..." />
          <CommandList>
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
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; title: string; message: string }>>([]);
  const [templateId, setTemplateId] = useState<string>("");
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

    setSubmitting(true);
    try {
      const payload: any = {
        title: trimmedTitle,
        message: trimmedMessage,
        recipientType,
        allowAnonymous,
      };

      if (recipientType === "employee") payload.selectedEmployeeIds = [selectedEmployeeId];
      if (recipientType === "department") payload.selectedDepartment = [selectedDepartmentId];
      if (recipientType === "designation") payload.selectedDesignation = [selectedDesignationId];

      await ENDPOINTS.createPulseSurvey(payload);

      toast({
        title: "Survey sent",
        description: "Survey created successfully.",
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
      <div className="w-full">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-4">
            <div className="text-xl font-bold">Create &amp; Send Survey</div>
            <div className="text-xs opacity-90 mt-1">
              Send a happiness survey to your team
            </div>
          </div>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Template (optional)</Label>
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
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No templates
                    </SelectItem>
                  ) : (
                    templates.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting a template will fill the title and message (you can still edit).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label htmlFor="survey-title">Survey Title</Label>
              <Input
                id="survey-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Are you happy?"
                className="h-11"
              />
            </div>

              <div className="flex items-start space-x-3 pt-7">
                <Checkbox
                  id="allow-anon"
                  checked={allowAnonymous}
                  onCheckedChange={(v) => setAllowAnonymous(Boolean(v))}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="allow-anon">Allow anonymous responses</Label>
                  <p className="text-xs text-muted-foreground">
                    Employees can choose to submit responses anonymously
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="survey-message">Message</Label>
              <Textarea
                id="survey-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={"How happy are you at work today? (1-10)\nTell us what could improve..."}
                className="min-h-[140px]"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Send To</Label>
                {loadingRecipients ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading recipients...
                  </div>
                ) : null}
              </div>
              <RadioGroup
                value={recipientType}
                onValueChange={(v) => setRecipientType(v as RecipientType)}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
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
                      "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
                      recipientType === opt.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "hover:bg-muted/40",
                    )}
                  >
                    <RadioGroupItem value={opt.value} id={`send-${opt.value}`} />
                    <div className="font-medium">{opt.label}</div>
                  </Label>
                ))}
              </RadioGroup>

              {recipientType !== "all" && (
                <div className="space-y-2 pt-2">
                  <Label>Recipient</Label>

                  {recipientType === "department" ? (
                    <Select
                      value={selectedDepartmentId}
                      onValueChange={setSelectedDepartmentId}
                      disabled={loadingRecipients}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={loadingRecipients ? "Loading..." : "Select department"} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
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
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={loadingRecipients ? "Loading..." : "Select designation"} />
                      </SelectTrigger>
                      <SelectContent>
                        {designations.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
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

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/pulse-surveys/dashboard")}
                className="h-11"
              >
                Cancel
              </Button>
              <Button type="button" onClick={onSubmit} disabled={submitting} className="h-11">
                {submitting ? "Sending..." : "Send Survey"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreatePulseSurvey;
