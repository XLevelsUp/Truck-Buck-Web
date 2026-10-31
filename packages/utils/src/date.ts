/**
 * India Standard Time helpers. IST is a fixed UTC+05:30 offset with no DST,
 * so all display and "business day" logic is pinned to it regardless of the
 * viewer's machine time zone. Store and transport instants as UTC ISO strings.
 */

export const IST_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date: ${String(input)}`);
  }
  return date;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

/** `05 Mar 2026` in IST. */
export function formatDateIST(input: DateInput): string {
  return dateFormatter.format(toDate(input));
}

/** `05 Mar 2026, 02:30 pm` in IST. */
export function formatDateTimeIST(input: DateInput): string {
  return dateTimeFormatter.format(toDate(input));
}

/** Calendar date in IST as `YYYY-MM-DD` — stable key for grouping by business day. */
export function toISTDateKey(input: DateInput): string {
  return new Date(toDate(input).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The UTC instant at which the IST calendar day containing `input` starts. */
export function startOfDayIST(input: DateInput): Date {
  return new Date(Date.parse(`${toISTDateKey(input)}T00:00:00+05:30`));
}
