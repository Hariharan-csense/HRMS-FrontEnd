import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "./ui/dropdown-menu";
import { ChevronDown, X } from "lucide-react";

export function PackageModuleSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const selected = Array.from(
    new Set(
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
  const entries = selected.map((item) => ({
    label: item.replace(/\s*\(add-on\)$/i, "").trim(),
    addon: /\s*\(add-on\)$/i.test(item),
  }));
  const allOptions = Array.from(
    new Set([...options, ...entries.map((item) => item.label)]),
  );
  const toggle = (module: string, checked: boolean) =>
    onChange(
      (checked
        ? [
            ...entries.map((item) =>
              item.addon ? `${item.label} (add-on)` : item.label,
            ),
            module,
          ]
        : entries
            .filter((item) => item.label !== module)
            .map((item) =>
              item.addon ? `${item.label} (add-on)` : item.label,
            )
      ).join("\n"),
    );
  const toggleAddon = (module: string) =>
    onChange(
      entries
        .map((item) =>
          item.label === module
            ? item.addon
              ? item.label
              : `${item.label} (add-on)`
            : item.addon
              ? `${item.label} (add-on)`
              : item.label,
        )
        .join("\n"),
    );
  return (
    <div className="space-y-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between bg-white"
            aria-label="Select package modules"
          >
            <span>
              {selected.length
                ? `${selected.length} modules selected`
                : "Select modules for this package"}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-80 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
        >
          {allOptions.map((module) => (
            <DropdownMenuCheckboxItem
              key={module}
              checked={entries.some((item) => item.label === module)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => toggle(module, checked)}
            >
              {module}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex flex-wrap gap-2">
        {entries.map(({ label: module, addon }) => (
          <span
            key={module}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800"
          >
            {module}
            <button
              type="button"
              className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                addon
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"
              }`}
              aria-label={`${addon ? "Mark" : "Mark"} ${module} as ${addon ? "included" : "add-on"}`}
              onClick={() => toggleAddon(module)}
            >
              {addon ? "Add-on · Mark included" : "+ Mark as add-on"}
            </button>
            <button
              type="button"
              aria-label={`Remove ${module}`}
              className="rounded p-0.5 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2"
              onClick={() => toggle(module, false)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Select modules, then mark each one as Included or Add-on.
      </p>
    </div>
  );
}
