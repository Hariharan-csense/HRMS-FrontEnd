import { toast } from "sonner";

export const pendingDeletionData = (result: any): any => {
  if (result?.pendingDeletion === true) return result;
  if (result?.data?.pendingDeletion === true) return result.data;
  return null;
};

export const notifyDeletionPending = (result: unknown): boolean => {
  const pending = pendingDeletionData(result);
  if (!pending) return false;
  toast.success("Deletion request submitted", {
    description: pending.message || "The record remains active until CEO approval.",
    duration: 7000,
  });
  return true;
};
