// `draw_date` is a plain string column. New values (written via the DrawDatePicker in
// admin.tsx) are always "YYYY-MM-DDTHH:mm:00" -- deliberately no timezone suffix, since the app
// already treats this as Pakistan-time wall-clock text (see index.tsx's getTimeLeft, which
// re-anchors it to PKT explicitly regardless of the viewer's own timezone). Older products may
// still hold free-text values an admin typed by hand (e.g. "30 June 2026, 10:00 PM") -- these are
// left as-is in the database and just passed through unchanged here, since they're already
// human-readable.

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ISO_DRAW_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

export type DrawDateParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour24: number; // 0-23
  minute: number;
};

export function parseDrawDateParts(value: string | null | undefined): DrawDateParts | null {
  if (!value) return null;
  const match = ISO_DRAW_DATE_PATTERN.exec(value);
  if (!match) return null;
  const [, year, month, day, hour24, minute] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour24: Number(hour24),
    minute: Number(minute),
  };
}

export function buildDrawDateIso(parts: DrawDateParts): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour24)}:${pad(parts.minute)}:00`;
}

// For pages that only ever display draw_date (never edit it), so old free-text values and new
// ISO values both render as something a user would actually expect to read.
export function formatDrawDate(value: string | null | undefined): string {
  if (!value) return '';
  const parts = parseDrawDateParts(value);
  if (!parts) return value; // legacy free text -- already human-readable, pass through
  const monthName = MONTH_NAMES[parts.month - 1] || String(parts.month);
  const meridiem = parts.hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = parts.hour24 % 12 === 0 ? 12 : parts.hour24 % 12;
  const minute = String(parts.minute).padStart(2, '0');
  return `${parts.day} ${monthName} ${parts.year}, ${hour12}:${minute} ${meridiem}`;
}
