import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { InlineEdit, isDoubleTap, saveInline } from "./InlineEdit";

const role = vi.hoisted(() => ({
  loading: false,
  canPerformModuleAction: vi.fn(),
}));
vi.mock("@/context/RoleContext", () => ({ useRole: () => role }));

beforeEach(() => {
  role.loading = false;
  role.canPerformModuleAction.mockReset().mockReturnValue(true);
});

describe("inline editing permissions", () => {
  const render = (disabled = false) =>
    renderToStaticMarkup(
      <InlineEdit
        label="Salary"
        value={25000}
        module="payroll"
        submodule="salary_structure"
        disabled={disabled}
        onSave={vi.fn()}
      />,
    );
  it("requires the module's update permission", () => {
    expect(render()).toContain('tabindex="0"');
    expect(role.canPerformModuleAction).toHaveBeenCalledWith(
      "payroll",
      "update",
      "salary_structure",
    );
    role.canPerformModuleAction.mockReturnValue(false);
    expect(render()).not.toContain("tabindex");
  });
  it("keeps locked records and loading permissions read-only", () => {
    expect(render(true)).not.toContain("Double-click");
    role.loading = true;
    expect(render()).not.toContain("Double-click");
  });
});

describe("touch editing gesture", () => {
  const first = { time: 1000, x: 20, y: 30 };
  it("accepts two nearby taps within the time window", () => {
    expect(isDoubleTap(first, { time: 1200, x: 22, y: 32 })).toBe(true);
  });
  it("rejects a single tap, distant taps, and slow taps", () => {
    expect(isDoubleTap(null, first)).toBe(false);
    expect(isDoubleTap(first, { time: 1200, x: 100, y: 30 })).toBe(false);
    expect(isDoubleTap(first, { time: 1500, x: 20, y: 30 })).toBe(false);
  });
});

describe("saving inline values", () => {
  it.each([
    { error: "Not allowed" },
    { success: false, message: "Not allowed" },
    { data: { success: false, message: "Not allowed" } },
  ])("does not refresh after an unsuccessful response: %j", async (result) => {
    const refresh = vi.fn();
    await expect(saveInline(Promise.resolve(result), refresh)).rejects.toThrow(
      "Not allowed",
    );
    expect(refresh).not.toHaveBeenCalled();
  });
  it("preserves a network failure and does not refresh", async () => {
    const refresh = vi.fn();
    await expect(
      saveInline(Promise.reject(new Error("Offline")), refresh),
    ).rejects.toThrow("Offline");
    expect(refresh).not.toHaveBeenCalled();
  });
  it("awaits persistence before refreshing", async () => {
    let resolve!: (value: unknown) => void;
    const request = new Promise((done) => {
      resolve = done;
    });
    const refresh = vi.fn();
    const pending = saveInline(request, refresh);
    expect(refresh).not.toHaveBeenCalled();
    resolve({ data: { success: true } });
    await pending;
    expect(refresh).toHaveBeenCalledOnce();
  });
});
