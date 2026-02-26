// Simple encryption/decryption for localStorage (basic security)
// Note: This is still not as secure as server-side sessions
// but provides better protection than plain text storage

class SecureStorage {
  private readonly SECRET_KEY = 'HRMS_SECURE_STORAGE_2024';

  // Simple XOR encryption (basic protection)
  private encrypt(text: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ this.SECRET_KEY.charCodeAt(i % this.SECRET_KEY.length)
      );
    }
    return btoa(result); // Base64 encode
  }

  private decrypt(encryptedText: string): string {
    try {
      const decoded = atob(encryptedText); // Base64 decode
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ this.SECRET_KEY.charCodeAt(i % this.SECRET_KEY.length)
        );
      }
      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  // Save encrypted data
  setItem(key: string, value: string): void {
    try {
      const encrypted = this.encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to encrypt and save data:', error);
    }
  }

  // Get and decrypt data
  getItem(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  // Remove item
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}

export const secureStorage = new SecureStorage();
