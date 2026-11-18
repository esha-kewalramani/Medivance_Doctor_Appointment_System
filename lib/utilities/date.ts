export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const pad = (n: number) => String(n).padStart(2, "0");

/** Local date -> YYYY-MM-DD (never UTC, so day boundaries are right in every timezone). */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function todayStr() { return toDateStr(new Date()); }
export function addDays(s: string, n: number): string {
  const d = parseDate(s); d.setDate(d.getDate() + n); return toDateStr(d);
}
export function weekdayOf(s: string): number { return parseDate(s).getDay(); }

export function fmtDate(s: string): string {
  return parseDate(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
export function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${ap}`;
}
export function toMinutes(t: string): number { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
export function fromMinutes(n: number): string { return `${pad(Math.floor(n / 60))}:${pad(n % 60)}`; }

/** True if the appointment moment is already in the past. */
export function isPast(date: string, time: string): boolean {
  const [h, m] = time.split(":").map(Number);
  const d = parseDate(date); d.setHours(h, m, 0, 0);
  return d.getTime() < Date.now();
}
export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
