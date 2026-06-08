import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const ASSET_ACCENT = "#17c491";

export const assetShellClass =
  "min-h-screen bg-[linear-gradient(180deg,#f7fffb_0%,#ffffff_38%,#f6faf8_100%)]";

export const assetContainerClass = "mx-auto w-full max-w-7xl px-4 py-4 sm:px-5 lg:px-6";

export const assetCardClass = "rounded-lg border border-slate-200 bg-white shadow-sm";

export const assetPrimaryButtonClass =
  "border-0 bg-[#17c491] text-white shadow-sm hover:bg-[#11966f]";

export const assetOutlineButtonClass =
  "border-[#17c491]/35 text-[#11966f] hover:bg-[#e9fbf5]";

export const assetInputClass =
  "border-slate-200 focus:border-[#17c491] focus:ring-[#17c491]";

type AssetPageHeaderProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export const AssetPageHeader: React.FC<AssetPageHeaderProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[#17c491]/20 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#17c491] text-white">
        {icon}
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-0.5 max-w-3xl text-sm leading-5 text-slate-600">
          {description}
        </p>
      </div>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

type AssetStatCardProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: "accent" | "amber" | "slate" | "rose";
};

const toneClasses = {
  accent: "bg-[#e9fbf5] text-[#11966f]",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-700",
  rose: "bg-rose-50 text-rose-700",
};

export const AssetStatCard: React.FC<AssetStatCardProps> = ({
  label,
  value,
  icon,
  tone = "accent",
}) => (
  <Card className={assetCardClass}>
    <CardContent className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <div className="mt-1 text-lg font-semibold text-slate-950">
            {value}
          </div>
        </div>
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);
