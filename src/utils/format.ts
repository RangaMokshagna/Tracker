/**
 * STRIDE — General formatting helpers.
 */

// ────────────────────────────────────────────────────────────
// Duration
// ────────────────────────────────────────────────────────────

/**
 * Format a duration in seconds to `"M:SS"` or `"H:MM:SS"`.
 *
 * @param totalSeconds - Elapsed time in seconds.
 * @returns Formatted string, e.g. `"32:15"` or `"1:02:15"`.
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0 || !Number.isFinite(totalSeconds)) return '0:00';

  const seconds = Math.floor(totalSeconds) % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3_600);

  const ss = seconds.toString().padStart(2, '0');
  const mm = hours > 0 ? minutes.toString().padStart(2, '0') : minutes.toString();

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ────────────────────────────────────────────────────────────
// Date / Time
// ────────────────────────────────────────────────────────────

/**
 * Format an ISO date string or Date object into a human-readable date.
 *
 * @param date - ISO string or Date.
 * @returns Formatted date, e.g. `"Oct 22, 2026"`.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string or Date as a short date + time.
 *
 * @param date - ISO string or Date.
 * @returns E.g. `"Oct 22 at 7:30 AM"`.
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const datePart = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} at ${timePart}`;
}

/**
 * Format a date into a relative time string (e.g. "2 hours ago", "Yesterday").
 *
 * @param date - ISO string or Date.
 * @returns Human-readable relative time.
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1_000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  }
  return formatDate(d);
}

// ────────────────────────────────────────────────────────────
// Elevation
// ────────────────────────────────────────────────────────────

/**
 * Format an elevation value.
 *
 * @param meters - Elevation in metres.
 * @param unit   - Display unit ('km' shows metres, 'mi' shows feet).
 * @returns Formatted string, e.g. `"152 m"` or `"499 ft"`.
 */
export function formatElevation(
  meters: number,
  unit: 'km' | 'mi' = 'km',
): string {
  if (unit === 'mi') {
    const feet = Math.round(meters * 3.28084);
    return `${feet} ft`;
  }
  return `${Math.round(meters)} m`;
}

// ────────────────────────────────────────────────────────────
// Numbers
// ────────────────────────────────────────────────────────────

/**
 * Format a large number with locale-aware separators.
 *
 * @param value - Numeric value.
 * @returns E.g. `"1,234"`.
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Format a day of the week from an ISO date.
 *
 * @param date - ISO string or Date.
 * @returns E.g. `"Monday"`.
 */
export function formatDayOfWeek(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}
