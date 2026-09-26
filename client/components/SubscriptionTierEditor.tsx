import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PricingTier } from "@/utils/subscriptionTiers";
import { Plus, Trash2 } from "lucide-react";

export function SubscriptionTierEditor({
  value,
  onChange,
  addon = false,
}: {
  value: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
  addon?: boolean;
}) {
  const normalize = (tiers: PricingTier[]) =>
    tiers.map((tier, i) => ({
      ...tier,
      min_users: i === 0 ? 1 : Number(tiers[i - 1].max_users) + 1,
    }));
  const update = (
    index: number,
    key: "max_users" | "price" | "yearly_price",
    amount: number,
  ) => {
    onChange(
      normalize(
        value.map((tier, i) =>
          i === index
            ? {
                ...tier,
                [key]: amount,
                ...(addon && key === "price" ? { yearly_price: amount } : {}),
              }
            : { ...tier },
        ),
      ),
    );
  };
  return (
    <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <div>
        <h4 className="font-semibold text-slate-900">
          Employee ranges & pricing
        </h4>
        <p className="mt-1 text-sm text-slate-600">
          Enter the employee limit and rate together. The matching range applies
          to every selected employee.
        </p>
      </div>
      <p className="text-xs text-slate-500">
        INR per employee / month. Annual billing collects 12 months.
      </p>
      {value.map((tier, i) => (
        <div
          key={i}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-emerald-100 bg-white p-4"
        >
          <label className="min-w-24 flex-1 text-xs text-slate-600">
            From employees
            <Input
              value={tier.min_users}
              readOnly
              className="mt-1 bg-slate-50"
            />
          </label>
          <label className="min-w-24 flex-1 text-xs text-slate-600">
            To employees
            {tier.max_users === null ? (
              <Input value="No limit" readOnly className="mt-1 bg-slate-50" />
            ) : (
              <Input
                className="mt-1"
                aria-label={"Tier " + (i + 1) + " upper limit"}
                type="number"
                min={tier.min_users}
                max={
                  i < value.length - 2
                    ? Number(value[i + 1].max_users) - 1
                    : undefined
                }
                step="1"
                required
                value={tier.max_users}
                onChange={(e) => update(i, "max_users", Number(e.target.value))}
              />
            )}
          </label>
          <label className="min-w-32 flex-1 text-xs text-slate-600">
            Monthly rate
            <Input
              className="mt-1"
              type="number"
              min="0"
              step="0.01"
              required
              value={tier.price}
              onChange={(e) => update(i, "price", Number(e.target.value))}
            />
          </label>
          {!addon && (
            <label className="min-w-32 flex-1 text-xs text-slate-600">
              Annual rate / month
              <Input
                className="mt-1"
                type="number"
                min="0"
                step="0.01"
                required
                value={tier.yearly_price}
                onChange={(e) =>
                  update(i, "yearly_price", Number(e.target.value))
                }
              />
            </label>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={value.length === 1}
            aria-label={"Remove employee range " + (i + 1)}
            onClick={() => {
              const next = value
                .filter((_, index) => index !== i)
                .map((t) => ({ ...t }));
              next[next.length - 1].max_users = null;
              onChange(normalize(next));
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const last = value[value.length - 1];
          onChange([
            ...value.slice(0, -1),
            { ...last, max_users: last.min_users + 49 },
            { ...last, min_users: last.min_users + 50, max_users: null },
          ]);
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add employee range
      </Button>
    </div>
  );
}
