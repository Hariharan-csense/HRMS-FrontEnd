export const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseIsoDateOnly = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

/** Leave apply window: 1 calendar month in the past through 1 month ahead. */
export const getLeaveApplicationDateBounds = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setMonth(minDate.getMonth() - 1);

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 1);

  return {
    min: formatIsoDate(minDate),
    max: formatIsoDate(maxDate),
    minDate,
    maxDate,
  };
};

export const isLeaveDateWithinApplicationWindow = (value: string): boolean => {
  const parsed = parseIsoDateOnly(value);
  if (!parsed) return false;
  const { minDate, maxDate } = getLeaveApplicationDateBounds();
  return parsed >= minDate && parsed <= maxDate;
};

export const leaveDateWindowValidationMessage = (fieldLabel: string) =>
  `${fieldLabel} must be within the previous 1 month or next 1 month`;
