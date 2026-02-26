/**
 * Formats an ISO date string (or any value accepted by the Date constructor)
 * into a localised, human-readable representation.
 *
 * @param dateString - ISO 8601 string, Unix timestamp, or any Date-parseable value.
 * @returns Formatted string, e.g. "Jan 15, 2025, 03:30 PM".
 *
 * @example
 * formatDate('2025-01-15T15:30:00Z') // "Jan 15, 2025, 03:30 PM"
 */
export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
