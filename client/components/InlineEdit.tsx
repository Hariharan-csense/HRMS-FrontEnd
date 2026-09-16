import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { cn } from "@/lib/utils";

type Value = string | number;
type Tap = { time: number; x: number; y: number };
export const isDoubleTap = (previous: Tap | null, current: Tap) =>
  Boolean(
    previous &&
    current.time - previous.time >= 0 &&
    current.time - previous.time < 350 &&
    Math.hypot(current.x - previous.x, current.y - previous.y) < 12,
  );
type Props = {
  value: Value | null | undefined;
  label: string;
  module: string;
  submodule?: string;
  disabled?: boolean;
  type?: "text" | "number" | "date" | "time" | "email" | "tel";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  options?: { value: string; label: string }[];
  children?: ReactNode;
  onSave: (value: Value) => Promise<void>;
};

/** Keeps failed saves editable; never sends requests on blur or cancellation. */
export function InlineEdit({
  value,
  label,
  module,
  submodule,
  disabled,
  type = "text",
  required,
  min,
  max,
  step = "any",
  options,
  children,
  onSave,
}: Props) {
  const { canPerformModuleAction, loading } = useRole();
  const allowed =
    !disabled &&
    !loading &&
    canPerformModuleAction(module, "update", submodule);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const input = useRef<HTMLInputElement | HTMLSelectElement | null>(null);
  const display = useRef<HTMLSpanElement>(null);
  const tap = useRef<Tap | null>(null);
  const pointerStart = useRef<Tap | null>(null);
  const startValue = useRef("");

  useEffect(() => {
    if (editing) {
      input.current?.focus();
      if (
        input.current instanceof HTMLInputElement &&
        ["text", "email", "tel"].includes(type)
      )
        input.current.select();
    }
  }, [editing, type]);

  const begin = () => {
    if (!allowed || editing) return;
    startValue.current = String(value ?? "");
    setDraft(startValue.current);
    setError("");
    setEditing(true);
  };
  const close = () => {
    setEditing(false);
    setError("");
    requestAnimationFrame(() => display.current?.focus());
  };
  const save = async () => {
    if (busy.current || !allowed) return;
    if (String(value ?? "") !== startValue.current) {
      setError("This value changed. Cancel and edit the latest value.");
      return;
    }
    if (!input.current?.checkValidity() || (required && !draft.trim())) {
      setError(input.current?.validationMessage || `${label} is required.`);
      return;
    }
    if (draft === startValue.current) {
      close();
      return;
    }
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await onSave(type === "number" && draft !== "" ? Number(draft) : draft);
      close();
    } catch (cause: unknown) {
      const failure = cause as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        failure?.response?.data?.message ||
          failure?.message ||
          "Could not save. Please try again.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  if (!editing || !allowed)
    return (
      <span
        ref={display}
        tabIndex={allowed ? 0 : undefined}
        aria-label={
          allowed
            ? `${label}: ${value ?? "empty"}. Double-click or double-tap to edit, or press F2.`
            : undefined
        }
        title={allowed ? "Double-click / double-tap to edit · F2" : undefined}
        className={cn(
          "inline-block max-w-full rounded",
          allowed &&
            "min-h-6 min-w-6 cursor-text touch-manipulation hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        )}
        onDoubleClick={(event) => {
          if (allowed) {
            event.stopPropagation();
            begin();
          }
        }}
        onPointerDown={(event) => {
          pointerStart.current = {
            time: Date.now(),
            x: event.clientX,
            y: event.clientY,
          };
        }}
        onPointerCancel={() => {
          pointerStart.current = null;
          tap.current = null;
        }}
        onPointerUp={(event) => {
          if (!allowed || event.pointerType === "mouse") return;
          const now = Date.now();
          if (
            !pointerStart.current ||
            Math.hypot(
              event.clientX - pointerStart.current.x,
              event.clientY - pointerStart.current.y,
            ) >= 12 ||
            now - pointerStart.current.time > 500
          ) {
            tap.current = null;
            return;
          }
          const previous = tap.current;
          if (
            isDoubleTap(previous, {
              time: now,
              x: event.clientX,
              y: event.clientY,
            })
          ) {
            event.preventDefault();
            event.stopPropagation();
            tap.current = null;
            begin();
          } else
            tap.current = { time: now, x: event.clientX, y: event.clientY };
        }}
        onKeyDown={(event) => {
          if (allowed && (event.key === "F2" || event.key === "Enter")) {
            event.preventDefault();
            event.stopPropagation();
            begin();
          }
        }}
      >
        {children ?? (value === "" || value == null ? "—" : String(value))}
      </span>
    );

  const controlProps = {
    "aria-label": label,
    "aria-invalid": Boolean(error),
    value: draft,
    disabled: saving,
    required,
    className:
      "min-w-0 w-full rounded border border-primary bg-background px-2 py-1 text-base text-foreground outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm",
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => setDraft(event.target.value),
  };
  return (
    <span
      data-inline-editing
      className="inline-flex w-full min-w-[10rem] max-w-[calc(100vw-3rem)] flex-col gap-1 align-middle normal-case font-normal text-foreground"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          if (!busy.current) close();
        }
        if (event.key === "Enter" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.stopPropagation();
          void save();
        }
      }}
    >
      <span className="flex items-center gap-1">
        {options ? (
          <select
            {...controlProps}
            ref={(element) => {
              input.current = element;
            }}
          >
            {!required && <option value="">None</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            {...controlProps}
            ref={(element) => {
              input.current = element;
            }}
            type={type}
            min={min}
            max={max}
            step={step}
          />
        )}
        <button
          type="button"
          aria-label={`Save ${label}`}
          disabled={saving}
          onClick={() => void save()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-primary/10 text-primary disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          aria-label={`Cancel editing ${label}`}
          disabled={saving}
          onClick={close}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded hover:bg-muted disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </span>
      {error && (
        <span
          role="alert"
          className="whitespace-normal text-xs text-destructive"
        >
          {error}
        </span>
      )}
    </span>
  );
}

/** Supports both existing helper results and Axios responses. */
export async function saveInline(
  request: Promise<unknown>,
  refresh: () => void | Promise<unknown>,
) {
  const result = (await request) as
    | {
        error?: string;
        success?: boolean;
        message?: string;
        data?: { success?: boolean; message?: string };
      }
    | undefined;
  if (
    !result ||
    result.error ||
    result.success === false ||
    result.data?.success === false
  ) {
    throw new Error(
      result?.error ||
        result?.message ||
        result?.data?.message ||
        "Could not save this value.",
    );
  }
  await refresh();
}
