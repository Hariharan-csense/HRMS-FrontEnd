export interface SavedProfile {
  email: string;
  name?: string;
  avatar?: string;
  companyName?: string;
  employee_id?: string;
  employeeId?: string;
  lastLogin: string;
  rememberMe: boolean;
}

export interface SavedAccount extends SavedProfile {
  refreshToken?: string;
  user?: any;
}

class ProfileManager {
  private readonly PROFILE_KEY = "savedProfile";
  private readonly CREDENTIALS_KEY = "savedCredentials";
  private readonly ACCOUNTS_KEY = "auth:savedAccounts";

  private normalizeEmail(email: string): string {
    return String(email || "").trim().toLowerCase();
  }

  getSavedAccounts(): SavedAccount[] {
    try {
      const raw = JSON.parse(localStorage.getItem(this.ACCOUNTS_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const accounts = raw.filter(
        (account) =>
          account?.email && new Date(account.lastLogin || 0).getTime() > cutoff,
      );
      if (accounts.length !== raw.length) {
        localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
      }
      return accounts;
    } catch {
      localStorage.removeItem(this.ACCOUNTS_KEY);
      return [];
    }
  }

  saveAccountSession(user: any, refreshToken?: string): SavedAccount[] {
    if (!user?.email) return this.getSavedAccounts();
    const email = this.normalizeEmail(user.email);
    const existing = this.getSavedAccounts();
    const previous = existing.find(
      (account) => this.normalizeEmail(account.email) === email,
    );
    const account: SavedAccount = {
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      companyName: user.companyName,
      employee_id: user.employee_id || user.employeeId,
      employeeId: user.employee_id || user.employeeId,
      lastLogin: new Date().toISOString(),
      rememberMe: true,
      refreshToken: refreshToken || previous?.refreshToken,
      user,
    };
    const accounts = [account, ...existing.filter(
      (item) => this.normalizeEmail(item.email) !== email,
    )];
    localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
    return accounts;
  }

  removeSavedAccount(email: string): SavedAccount[] {
    const normalized = this.normalizeEmail(email);
    const accounts = this.getSavedAccounts().filter(
      (account) => this.normalizeEmail(account.email) !== normalized,
    );
    localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
    return accounts;
  }

  // Save user profile when remember me is checked
  saveProfile(user: any, rememberMe: boolean): void {
    if (rememberMe && user) {
      const profile: SavedProfile = {
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        companyName: user.companyName,
        employee_id: user.employee_id || user.employeeId,
        employeeId: user.employee_id || user.employeeId,
        lastLogin: new Date().toISOString(),
        rememberMe: true,
      };

      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
      this.saveAccountSession(user);
      // console.log('Profile saved for remember me:', profile);
    } else if (!rememberMe) {
      // Clear saved profile if remember me is unchecked
      this.clearSavedProfile();
    }
  }

  // Save email only for remember-me. Passwords are never stored.
  saveCredentials(email: string, rememberMe: boolean = false): void {
    if (rememberMe && email) {
      const credentials = {
        email: email,
        rememberMe: true,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));

      // console.log('Credentials saved for remember me:', { email: email.substring(0, 3) + '***' });
    } else if (!rememberMe) {
      this.clearSavedCredentials();
    }

    this.clearSavedPassword();
  }

  // Password storage is disabled. Clear old legacy data if present.
  getSavedPassword(): string | null {
    this.clearSavedPassword();
    return null;
  }

  // Get saved profile
  getSavedProfile(): SavedProfile | null {
    try {
      const saved = localStorage.getItem(this.PROFILE_KEY);
      if (saved) {
        const profile = JSON.parse(saved);
        // Check if profile is still valid (not older than 30 days)
        const lastLogin = new Date(profile.lastLogin);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (lastLogin > thirtyDaysAgo) {
          return profile;
        } else {
          // Clear old profile
          this.clearSavedProfile();
          return null;
        }
      }
    } catch (error) {
      console.error("Error loading saved profile:", error);
      this.clearSavedProfile();
    }
    return null;
  }

  // Get saved credentials
  getSavedCredentials(): {
    email: string;
    rememberMe: boolean;
    savedAt?: string;
  } | null {
    try {
      const saved = localStorage.getItem(this.CREDENTIALS_KEY);
      if (saved) {
        const credentials = JSON.parse(saved);
        // Check if credentials are still valid (not older than 30 days)
        const savedAt = new Date(credentials.savedAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (savedAt > thirtyDaysAgo) {
          return {
            email: credentials.email,
            rememberMe: credentials.rememberMe,
            savedAt: credentials.savedAt,
          };
        } else {
          // Clear old credentials
          this.clearSavedCredentials();
          return null;
        }
      }
    } catch (error) {
      console.error("Error loading saved credentials:", error);
      this.clearSavedCredentials();
    }
    return null;
  }

  // Clear saved profile
  clearSavedProfile(): void {
    localStorage.removeItem(this.PROFILE_KEY);
    // console.log('Saved profile cleared');
  }

  // Clear saved credentials
  clearSavedCredentials(): void {
    localStorage.removeItem(this.CREDENTIALS_KEY);
    // console.log('Saved credentials cleared');
  }

  // Clear legacy password entries from older builds
  clearSavedPassword(): void {
    localStorage.removeItem("savedPassword");
    // console.log('Saved password cleared');
  }

  // Clear all saved data
  clearAll(): void {
    this.clearSavedProfile();
    this.clearSavedCredentials();
    this.clearSavedPassword();
    localStorage.removeItem(this.ACCOUNTS_KEY);
  }

  // Check if user has saved profile
  hasSavedProfile(): boolean {
    return this.getSavedProfile() !== null;
  }

  // Check if user has saved credentials
  hasSavedCredentials(): boolean {
    return this.getSavedCredentials() !== null;
  }
}

export const profileManager = new ProfileManager();
export default profileManager;
