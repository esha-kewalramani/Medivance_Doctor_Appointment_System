import { useMemo } from "react";
import { Appointment } from "@/types";

export function countBy(list: Appointment[]) {
  const c = { total: list.length, pending: 0, approved: 0, completed: 0, cancelled: 0, rejected: 0 };
  list.forEach((a) => { c[a.status] += 1; });
  return c;
}
export const useCounts = (list: Appointment[]) => useMemo(() => countBy(list), [list]);
