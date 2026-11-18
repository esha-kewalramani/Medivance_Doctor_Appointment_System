import { Appointment, Doctor } from "@/types";

const pad = (n: number) => String(n).padStart(2, "0");
const local = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

function span(a: Appointment, doc?: Doctor) {
  const [y, m, d] = a.date.split("-").map(Number);
  const [hh, mm] = a.time.split(":").map(Number);
  const start = new Date(y, m - 1, d, hh, mm);
  return { start, end: new Date(start.getTime() + (doc?.slotMinutes ?? 30) * 60000) };
}
const title = (doc?: Doctor) => `Appointment with ${doc?.name ?? "your doctor"} - MEDIVANCE`;
const details = (a: Appointment, doc?: Doctor) => `Ref: ${a.ref}\nDoctor: ${doc?.name ?? "-"} (${doc?.specialization ?? "-"})\nReason: ${a.reason}`;

export function googleCalendarUrl(a: Appointment, doc?: Doctor) {
  const { start, end } = span(a, doc);
  const q = new URLSearchParams({ action: "TEMPLATE", text: title(doc), dates: `${local(start)}/${local(end)}`, details: details(a, doc), location: "MEDIVANCE Hospital" });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export function icsText(a: Appointment, doc?: Doctor) {
  const { start, end } = span(a, doc);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MEDIVANCE//Appointments//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${a.id}@medivance`, `DTSTAMP:${local(new Date())}`, `DTSTART:${local(start)}`, `DTEND:${local(end)}`,
    `SUMMARY:${esc(title(doc))}`, `DESCRIPTION:${esc(details(a, doc))}`, "LOCATION:MEDIVANCE Hospital",
    "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY", "DESCRIPTION:Appointment in 1 hour", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(a: Appointment, doc?: Doctor) {
  const blob = new Blob([icsText(a, doc)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `medivance-appointment-${a.ref}.ics`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Human countdown such as "in 2 days" / "in 3 h 20 min" / "starting now". Returns null when it is in the past. */
export function countdownText(date: string, time: string, now = new Date()) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const diff = new Date(y, m - 1, d, hh, mm).getTime() - now.getTime();
  if (diff < -30 * 60000) return null;
  if (diff <= 60000) return "now";
  const mins = Math.floor(diff / 60000), hours = Math.floor(mins / 60), days = Math.floor(hours / 24);
  if (days >= 1) return `in ${days} day${days > 1 ? "s" : ""}${days < 3 && hours % 24 ? ` ${hours % 24} h` : ""}`;
  if (hours >= 1) return `in ${hours} h ${mins % 60} min`;
  return `in ${mins} min`;
}
