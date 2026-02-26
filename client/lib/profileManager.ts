interface SavedProfile {
  email: string;
  password?: string; // Encrypted password
  name?: string;
  avatar?: string;
  companyName?: string;
  lastLogin: string;
  rememberMe: boolean;
}

import { secureStorage } from './secureStorage';

class ProfileManager {
  private readonly PROFILE_KEY = 'savedProfile';
  private readonly CREDENTIALS_KEY = 'savedCredentials';
  private readonly PASSWORD_KEY = 'savedPassword';

  // Save user profile when remember me is checked
  saveProfile(user: any, rememberMe: boolean): void {
    if (rememberMe && user) {
      const profile: SavedProfile = {
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        companyName: user.companyName,
        lastLogin: new Date().toISOString(),
        rememberMe: true
      };
      
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
      console.log('Profile saved for remember me:', profile);
    } else if (!rememberMe) {
      // Clear saved profile if remember me is unchecked
      this.clearSavedProfile();
    }
  }

  // Save credentials (email and password, encrypted)
  saveCredentials(email: string, password?: string, rememberMe: boolean = false): void {
    if (rememberMe && email) {
      const credentials = {
        email: email,
        rememberMe: true,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
      
      // Save password securely if provided
      if (password) {
        secureStorage.setItem(this.PASSWORD_KEY, password);
        console.log('Password saved securely for remember me');
      }
      
      console.log('Credentials saved for remember me:', { email: email.substring(0, 3) + '***' });
    } else if (!rememberMe) {
      this.clearSavedCredentials();
    }
  }

  // Get saved password
  getSavedPassword(): string | null {
    try {
      const saved = secureStorage.getItem(this.PASSWORD_KEY);
      if (saved) {
        // Check if password is still valid (not older than 30 days)
        const credentials = this.getSavedCredentials();
        if (credentials && credentials.rememberMe) {
          const savedAt = new Date(credentials.savedAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (savedAt > thirtyDaysAgo) {
            return saved;
          } else {
            // Clear old password
            this.clearSavedPassword();
            return null;
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved password:', error);
      this.clearSavedPassword();
    }
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
      console.error('Error loading saved profile:', error);
      this.clearSavedProfile();
    }
    return null;
  }

  // Get saved credentials
  getSavedCredentials(): { email: string; rememberMe: boolean; savedAt?: string } | null {
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
            savedAt: credentials.savedAt
          };
        } else {
          // Clear old credentials
          this.clearSavedCredentials();
          return null;
        }
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
      this.clearSavedCredentials();
    }
    return null;
  }

  // Clear saved profile
  clearSavedProfile(): void {
    localStorage.removeItem(this.PROFILE_KEY);
    console.log('Saved profile cleared');
  }

  // Clear saved credentials
  clearSavedCredentials(): void {
    localStorage.removeItem(this.CREDENTIALS_KEY);
    console.log('Saved credentials cleared');
  }

  // Clear saved password
  clearSavedPassword(): void {
    secureStorage.removeItem(this.PASSWORD_KEY);
    console.log('Saved password cleared');
  }

  // Clear all saved data
  clearAll(): void {
    this.clearSavedProfile();
    this.clearSavedCredentials();
    this.clearSavedPassword();
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
