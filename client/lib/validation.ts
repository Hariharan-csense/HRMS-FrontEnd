export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const isValidEmail = (email: string): boolean => {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized);
};

export const normalizePhone = (phone: string): string => phone.trim();

export const sanitizePhoneInput = (phone: string): string =>
  normalizePhone(phone).replace(/\D/g, "").slice(0, 10);

export const isValidPhone = (phone: string): boolean => {
  const digitsOnly = sanitizePhoneInput(phone);
  return /^[6-9]\d{9}$/.test(digitsOnly);
};

export const isOptionalPhoneValid = (phone?: string): boolean => {
  if (!phone || !phone.trim()) return true;
  return isValidPhone(phone);
};
