import { Appointment } from "@/types";
import { todayISO, toMin } from "@/lib/utilities";

export type Bucket = "Upcoming" | "Pending" | "Past" | "Cancelled";
export function bucket(a: Appointment): Bucket {
  const t = todayISO();
  if (a.status === "cancelled" || a.status === "rejected") return "Cancelled";
  if (a.status === "completed" || a.date < t) return "Past";
  return a.status === "approved" ? "Upcoming" : "Pending";
}

/** Check if an appointment's slot has elapsed/passed */
export function isPassedSlot(a: Appointment): boolean {
  if (a.status === "cancelled" || a.status === "rejected" || a.status === "completed") return false;
  const t = todayISO();
  if (a.date < t) return true;
  if (a.date === t) {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return toMin(a.time) + 30 <= nowMin;
  }
  return false;
}
