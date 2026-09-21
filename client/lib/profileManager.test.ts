import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { profileManager } from "./profileManager";

describe("remembered accounts", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("restores multiple accounts after a fresh module load and extended inactivity", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01"));
    profileManager.saveProfile({ email: "a@example.com" }, true);
    profileManager.saveAccountSession({ email: "a@example.com" }, "token-a");
    profileManager.saveAccountSession({ email: "b@example.com" }, "token-b");
    vi.setSystemTime(new Date("2026-03-01"));
    vi.resetModules();
    const { profileManager: restored } = await import("./profileManager");
    expect(restored.getSavedAccounts().map((account) => account.email)).toEqual([
      "b@example.com", "a@example.com",
    ]);
    expect(restored.getSavedProfile()?.email).toBe("a@example.com");
  });

  it("updates only the saved account whose refresh token rotated", () => {
    profileManager.saveAccountSession({ email: "a@example.com" }, "token-a");
    profileManager.saveAccountSession({ email: "b@example.com" }, "token-b");
    profileManager.updateSavedRefreshToken("token-a", "new-token-a");
    expect(profileManager.getSavedAccounts().map((account) => account.refreshToken))
      .toEqual(["token-b", "new-token-a"]);
  });

  it("keeps saved accounts when the login form clears its remembered identity", () => {
    profileManager.saveProfile({ email: "a@example.com" }, true);
    profileManager.clearSavedProfile();
    profileManager.clearSavedCredentials();
    expect(profileManager.getSavedAccounts()).toHaveLength(1);
  });

  it("removes legacy identity too so a forgotten account is not restored", () => {
    profileManager.saveProfile({ email: "a@example.com" }, true);
    profileManager.saveCredentials("a@example.com", true);
    expect(profileManager.removeSavedAccount("A@example.com")).toEqual([]);
    expect(profileManager.getSavedProfile()).toBeNull();
    expect(profileManager.getSavedCredentials()).toBeNull();
  });
});
