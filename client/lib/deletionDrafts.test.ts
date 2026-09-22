import { beforeEach, describe, expect, it, vi } from "vitest";
import { pendingDeletionData, notifyDeletionPending } from "./deletionDrafts";
import { employeeApi } from "@/components/helper/employee/employee";
import { toast } from "sonner";
const endpoint = vi.hoisted(() => ({ deleteEmployee: vi.fn() }));
vi.mock("@/lib/endpoint", () => ({ default: endpoint, BASE_URL: "http://test.invalid" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

describe("pending deletion response", () => {
  beforeEach(() => vi.clearAllMocks());
  it("survives the employee API helper so the UI does not remove the employee", async () => {
    const data = { success: true, pendingDeletion: true, requestId: 3, message: "Awaiting CEO approval" };
    endpoint.deleteEmployee.mockResolvedValue({ status: 202, data });
    const result = await employeeApi.deleteEmployee("10");
    expect(pendingDeletionData(result)).toEqual(data);
    expect(notifyDeletionPending(result)).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("Deletion request submitted", expect.objectContaining({ description: data.message }));
  });
  it("does not mislabel failures or completed deletes as pending", () => {
    for (const result of [undefined, { error: "Forbidden" }, { success: true }, { data: { success: true } }]) {
      expect(notifyDeletionPending(result)).toBe(false);
    }
    expect(toast.success).not.toHaveBeenCalled();
  });
});
