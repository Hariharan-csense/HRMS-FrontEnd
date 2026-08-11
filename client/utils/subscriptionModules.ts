type SubscriptionLike = {
  plan_name?: string | null;
  plan_description?: string | null;
  status?: string;
  is_trial_active?: boolean;
  trial_days_remaining?: number;
  addons?: Array<{
    module_key?: string | null;
    name?: string | null;
    description?: string | null;
    users_count?: number;
    assigned_employee_ids?: number[];
  }>;
};

const normalizeLine = (line: string) => line.trim().toLowerCase();

const normalizeModuleKey = (value: string) =>
  normalizeLine(value).replace(/[\s-]+/g, "_");

export const getAddonModuleAliases = (moduleKey?: string | null, name?: string | null, description?: string | null) => {
  const key = normalizeModuleKey(moduleKey || "");
  const text = `${name || ""} ${description || ""}`.toLowerCase();
  const modules = new Set<string>();

  if (key) modules.add(key);

  if (
    key === "live_tracking" ||
    key === "tracking_management" ||
    key === "tracking" ||
    (text.includes("tracking") && !text.includes("applicant"))
  ) {
    modules.add("live_tracking");
  }

  if (key === "client_attendance" || text.includes("client attendance") || text.includes("field attendance")) {
    modules.add("client_attendance");
    modules.add("client_attendance_admin");
    modules.add("my_clients");
    modules.add("my_analytics");
  }

  if (key === "expenses" || text.includes("expense")) modules.add("expenses");
  if (key === "tickets" || key === "hr_helpdesk" || text.includes("ticket") || text.includes("helpdesk")) {
    modules.add("tickets");
    modules.add("hr_helpdesk");
  }
  if (key === "assets" || text.includes("asset")) modules.add("assets");
  if (
    key === "ai_assistant" ||
    key === "ai_chat" ||
    key === "chatbot" ||
    text.includes("ai assistant") ||
    text.includes("ai chat") ||
    text.includes("chatbot")
  ) {
    modules.add("ai_assistant");
  }
  if (key === "payroll" || key === "payroll_audit" || text.includes("payroll")) modules.add("payroll");
  if (key === "shift_roster" || key === "roster" || text.includes("roster")) modules.add("attendance");
  if (key === "hr_management" || text.includes("recruitment") || text.includes("rms")) modules.add("hr_management");
  if (key === "exit" || text.includes("offboarding")) modules.add("exit");
  if (key === "kpi" || text.includes("kpi")) modules.add("kpi");

  return modules;
};

export const hasSubscriptionAddonModule = (
  subscription: SubscriptionLike | null | undefined,
  moduleName: string,
  options?: { currentEmployeeId?: number | null; addonAdminBypass?: boolean }
) => {
  const wanted = normalizeModuleKey(moduleName);
  return (subscription?.addons || []).some((addon) => {
    if (!getAddonModuleAliases(addon.module_key, addon.name, addon.description).has(wanted)) {
      return false;
    }

    if (!options) return true;
    if (options.addonAdminBypass) return true;

    const assignedIds = Array.isArray(addon.assigned_employee_ids)
      ? addon.assigned_employee_ids.map((id) => Number(id))
      : [];

    return options.currentEmployeeId
      ? assignedIds.includes(Number(options.currentEmployeeId))
      : false;
  });
};

const addAll = (set: Set<string>, items: string[]) => {
  for (const item of items) set.add(item);
};

/** Modules included on the Free Plan tier (and when subscription is inactive). */
export const FREEPLAN_MODULES = [
  "subscription",
  "organization",
  "role_access",
  "employees",
  "pulse_surveys",
];

const FREE_FOREVER_MODULES = [...FREEPLAN_MODULES];

const BASIC_MODULES = [
  ...FREE_FOREVER_MODULES,
  "attendance",
  "shift management",
  "leave",
  "reports",
];

// Your "Standard" plan definition: Basic + these modules.
const STANDARD_MODULES = [
  ...BASIC_MODULES,
  "payroll",
  "client_attendance",
  "client_attendance_admin",
  "my_clients",
  "my_analytics",
  "expenses",
  "assets",
  "live_tracking",
  "tickets",
  "hr_helpdesk",
  "ai_assistant",
  "role_access",
  "kpi",
];

// Your "Advanced" plan definition: Standard + these modules.
const ADVANCED_MODULES = [
  ...STANDARD_MODULES,
  "hr_management",
  "exit",
  "pulse_surveys",
];

const inferTierFromPlanName = (planName?: string | null) => {
  const name = (planName || "").toLowerCase().replace(/[\s_-]+/g, "");
  if (!name) return null;

  if (
    name.includes("freeplan") ||
    name.includes("freepackage") ||
    (name.includes("free") && !name.includes("trial"))
  ) {
    return "freeplan";
  }
  if (name.includes("basic")) return "basic";
  if (name.includes("standard") || name.includes("professional")) return "standard";
  if (name.includes("advanced") || name.includes("advance") || name.includes("enterprise"))
    return "advanced";
  return null;
};

const applyDescriptionModuleLines = (modules: Set<string>, description: string) => {
  const lines = description
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  for (const line of lines) {
    if (line.includes("all in basic")) addAll(modules, BASIC_MODULES);
    if (line.includes("all in standard")) addAll(modules, STANDARD_MODULES);

    if (line.includes("organization")) modules.add("organization");
    if (
      line.includes("employee") &&
      (line.includes("management") || line.includes("profile") || line.includes("list"))
    ) {
      modules.add("employees");
    } else if (line.includes("employee")) {
      modules.add("employees");
    }

    if (line.includes("attendance")) {
      modules.add("attendance");
      modules.add("shift management");
    }
    if (line.includes("roster") || line.includes("shift planner")) modules.add("attendance");

    if (line.includes("leave")) modules.add("leave");
    if (line.includes("payroll")) modules.add("payroll");
    if (line.includes("expense")) modules.add("expenses");
    if (line.includes("asset")) modules.add("assets");
    if (
      line.includes("ai assistant") ||
      line.includes("ai chat") ||
      line.includes("chatbot")
    ) {
      modules.add("ai_assistant");
    }
    if (line.includes("exit") || line.includes("offboarding")) modules.add("exit");

    if (line.includes("reports")) modules.add("reports");
    if (line.includes("kpi")) modules.add("kpi");
    if (
      (line.includes("role") && (line.includes("permission") || line.includes("access"))) ||
      (line.includes("role") && line.includes("module"))
    ) {
      modules.add("role_access");
    }

    if (
      line.includes("recruitment") ||
      line.includes("rms") ||
      line.includes("hr management") ||
      line.includes("onboarding")
    ) {
      modules.add("hr_management");
    }
    if (line.includes("live tracking")) modules.add("live_tracking");

    if (line.includes("client attendance admin")) modules.add("client_attendance_admin");
    if (line.includes("client attendance")) {
      modules.add("client_attendance");
      modules.add("client_attendance_admin");
      modules.add("my_clients");
      modules.add("my_analytics");
    }

    if (line.includes("ticket") || line.includes("helpdesk")) {
      modules.add("tickets");
      modules.add("hr_helpdesk");
    }
    if (line.includes("pulse") || line.includes("survey")) modules.add("pulse_surveys");
  }
};

export const getAllowedModulesFromSubscription = (
  subscription: SubscriptionLike | null | undefined,
  subscriptionLoading?: boolean,
  options?: { trialEndingSoonDays?: number; currentEmployeeId?: number | null; addonAdminBypass?: boolean }
): Set<string> | null => {
  // While loading, be conservative to avoid showing modules incorrectly.
  if (subscriptionLoading) return new Set<string>(FREE_FOREVER_MODULES);

  // No subscription: keep free-forever modules available.
  if (!subscription) return new Set<string>(FREE_FOREVER_MODULES);

  const status = (subscription.status || "").toLowerCase();
  const isTrialActive = Boolean(subscription.is_trial_active);
  const trialDaysRemaining = Number(subscription.trial_days_remaining ?? 0);
  const trialEndingSoonDays = options?.trialEndingSoonDays ?? 2;

  // During an active trial (not ending soon), allow the full app (no subscription-based restriction).
  if (status === "trial" && isTrialActive) {
    if (trialDaysRemaining > trialEndingSoonDays) {
      return null;
    }
  }

  const isInactive =
    status === "expired" ||
    status === "cancelled" ||
    (status === "trial" && (!isTrialActive || trialDaysRemaining <= 0));

  if (isInactive) return new Set<string>(FREE_FOREVER_MODULES);

  const tier = inferTierFromPlanName(subscription.plan_name);
  const description = subscription.plan_description || "";

  if (tier === "freeplan") {
    const freeModules = new Set<string>(FREEPLAN_MODULES);
    for (const addon of subscription.addons || []) {
      const assignedIds = Array.isArray(addon.assigned_employee_ids)
        ? addon.assigned_employee_ids.map((id) => Number(id))
        : [];
      const shouldIncludeAddon =
        options?.addonAdminBypass ||
        (options?.currentEmployeeId ? assignedIds.includes(Number(options.currentEmployeeId)) : false);

      if (!shouldIncludeAddon) continue;

      for (const moduleKey of getAddonModuleAliases(addon.module_key, addon.name, addon.description)) {
        freeModules.add(moduleKey);
      }
    }
    return freeModules;
  }

  const modules = new Set<string>(FREE_FOREVER_MODULES);

  // Plan inheritance: allow base modules for the current plan tier, even if the description uses legacy text
  // like "All in Standard + ...". Description parsing below will still add any extra modules mentioned.
  if (tier === "basic") addAll(modules, BASIC_MODULES);
  if (tier === "standard") addAll(modules, STANDARD_MODULES);
  if (tier === "advanced") addAll(modules, ADVANCED_MODULES);

  applyDescriptionModuleLines(modules, description);

  for (const addon of subscription.addons || []) {
    const assignedIds = Array.isArray(addon.assigned_employee_ids)
      ? addon.assigned_employee_ids.map((id) => Number(id))
      : [];
    const shouldIncludeAddon =
      options?.addonAdminBypass ||
      (options?.currentEmployeeId ? assignedIds.includes(Number(options.currentEmployeeId)) : false);

    if (!shouldIncludeAddon) continue;

    for (const moduleKey of getAddonModuleAliases(addon.module_key, addon.name, addon.description)) {
      modules.add(moduleKey);
    }
  }

  return modules;
};
