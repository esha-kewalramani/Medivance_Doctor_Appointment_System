import { Appointment } from "@/types";
import { todayISO } from "@/lib/utilities";

export type Bucket = "Upcoming" | "Pending" | "Past" | "Cancelled";
export function bucket(a: Appointment): Bucket {
  const t = todayISO();
  if (a.status === "cancelled" || a.status === "rejected") return "Cancelled";
  if (a.status === "completed" || a.date < t) return "Past";
  return a.status === "approved" ? "Upcoming" : "Pending";
}
