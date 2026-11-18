import { AppointmentStatus } from "@/types";

export default function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge badge-${status} capitalize`}>{status}</span>;
}
