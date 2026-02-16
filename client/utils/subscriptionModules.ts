type SubscriptionLike = {
  plan_description?: string | null;
  status?: string;
  is_trial_active?: boolean;
  trial_days_remaining?: number;
};

const normalizeLine = (line: string) => line.trim().toLowerCase();

export const getAllowedModulesFromSubscription = (
  subscription: SubscriptionLike | null | undefined,
  subscriptionLoading?: boolean,
  options?: { trialEndingSoonDays?: number }
): Set<string> | null => {
  // While loading, be conservative to avoid showing modules incorrectly.
  if (subscriptionLoading) return new Set<string>(["subscription"]);

  // No subscription: only allow subscription management (Dashboard is handled separately by caller).
  if (!subscription) return new Set<string>(["subscription"]);

  const status = (subscription.status || "").toLowerCase();
  const isTrialActive = Boolean(subscription.is_trial_active);
  const trialEndingSoonDays = options?.trialEndingSoonDays ?? 2;

  // During an active trial (not ending soon), allow the full app (no subscription-based restriction).
  if (status === "trial" && isTrialActive) {
    const remaining = Number(subscription.trial_days_remaining ?? 0);
    if (remaining > trialEndingSoonDays) {
      return null;
    }
  }

  const isInactive =
    status === "expired" ||
    status === "cancelled" ||
    (status === "trial" && !isTrialActive);

  if (isInactive) return new Set<string>(["subscription"]);

  const modules = new Set<string>(["subscription"]);
  const description = subscription.plan_description || "";

  const lines = description
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  for (const line of lines) {
    if (line.includes("organization")) modules.add("organization");
    if (line.includes("employee")) modules.add("employees");

    if (line.includes("attendance")) {
      modules.add("attendance");
      modules.add("shift management");
    }

    if (line.includes("leave")) modules.add("leave");
    if (line.includes("payroll")) modules.add("payroll");
    if (line.includes("expense")) modules.add("expenses");
    if (line.includes("asset")) modules.add("assets");
    if (line.includes("exit") || line.includes("offboarding")) modules.add("exit");

    if (line.includes("reports")) modules.add("reports");
    if (line.includes("role") && line.includes("module") && line.includes("access")) modules.add("role_access");

    if (line.includes("recruitment") || line.includes("rms") || line.includes("hr management")) modules.add("hr_management");
    if (line.includes("live tracking")) modules.add("live_tracking");

    // Order matters: check admin string first so it doesn't get swallowed by "client attendance"
    if (line.includes("client attendance admin")) modules.add("client_attendance_admin");
    if (line.includes("client attendance")) modules.add("client_attendance");

    if (line.includes("ticket")) modules.add("tickets");
    if (line.includes("pulse")) modules.add("pulse_surveys");
  }

  return modules;
};
