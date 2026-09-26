import {
  Banknote,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  DoorOpen,
  Fingerprint,
  Headphones,
  MapPin,
  Package,
  Receipt,
  ShieldCheck,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";

const artwork = {
  expenses: { image: "expenses", icon: Receipt, label: "Expense management" },
  payroll: { image: "expenses", icon: Banknote, label: "Payroll" },
  payroll_audit: {
    image: "expenses",
    icon: ShieldCheck,
    label: "Payroll audit",
  },
  live_tracking: { image: "workforce", icon: MapPin, label: "Live tracking" },
  client_attendance: {
    image: "workforce",
    icon: ClipboardCheck,
    label: "Field attendance",
  },
  attendance: { image: "workforce", icon: ClipboardCheck, label: "Attendance" },
  essl_setup: {
    image: "workforce",
    icon: Fingerprint,
    label: "eSSL device setup",
  },
  shift_roster: {
    image: "workforce",
    icon: CalendarDays,
    label: "Shift planning",
  },
  timesheets: { image: "workforce", icon: Timer, label: "Time sheets" },
  kpi: {
    image: "workforce",
    icon: TrendingUp,
    label: "Performance management",
  },
  hr_management: {
    image: "workforce",
    icon: BriefcaseBusiness,
    label: "Recruitment",
  },
  exit: { image: "workforce", icon: DoorOpen, label: "Offboarding" },
  assets: { image: "workforce", icon: Package, label: "Asset management" },
  hr_helpdesk: { image: "support", icon: Headphones, label: "HR helpdesk" },
  ai_assistant: { image: "support", icon: Bot, label: "AI assistant" },
  default: { image: "workforce", icon: Users, label: "Team workspace" },
};

/** The saved module key drives the same artwork in previews and customer cards. */
export function AddonIllustration({
  moduleKey,
  className = "",
}: {
  moduleKey?: string;
  className?: string;
}) {
  const key = (moduleKey || "").trim().toLowerCase();
  const entry = Object.prototype.hasOwnProperty.call(artwork, key)
    ? artwork[key as keyof typeof artwork]
    : artwork.default;
  const Icon = entry.icon;

  return (
    <div
      className={`relative h-28 w-44 shrink-0 overflow-hidden rounded-xl bg-white ${className}`}
    >
      <img
        key={entry.image}
        src={`/images/addons/${entry.image}.png`}
        alt={`${entry.label} illustration`}
        width={176}
        height={112}
        loading="lazy"
        className="h-full w-full object-contain"
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
      />
      <span
        className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700"
        title={entry.label}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
  );
}
