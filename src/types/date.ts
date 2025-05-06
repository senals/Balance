/**
 * Represents a date that can be either a string in ISO format or a Date object
 */
export type DateLike = string | Date;

/**
 * Type guard to check if a value is a Date object
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date || Object.prototype.toString.call(value) === '[object Date]';
}

/**
 * Converts a DateLike to an ISO string
 */
export function toISOString(date: DateLike): string {
  if (typeof date === 'string') {
    return date;
  }
  if (isDate(date)) {
    return date.toISOString();
  }
  return new Date(date).toISOString();
}

/**
 * Converts a DateLike to a Date object
 */
export function toDate(date: DateLike): Date {
  if (isDate(date)) {
    return date;
  }
  return new Date(date);
} 