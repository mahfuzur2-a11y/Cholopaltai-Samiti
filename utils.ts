// src/utils.ts

// Converts a YYYY-MM-DD string (from date input) to DD-MM-YY
export const formatInputDateToUser = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year.slice(-2)}`;
};

// Converts a DD-MM-YY string to a Date object for comparisons and sorting
export const parseUserDate = (dateStr: string): Date => {
  if (!dateStr || !dateStr.includes('-')) return new Date(0); // return epoch on invalid date
  const [day, month, year] = dateStr.split('-').map(Number);
  // Assuming all years are in the 2000s for 2-digit year format
  return new Date(2000 + year, month - 1, day);
};
