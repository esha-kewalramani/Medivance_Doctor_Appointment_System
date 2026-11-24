"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import RescheduleModal from "@/components/appointments/RescheduleModal";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useApp } from "@/hooks/useApp";
import { confirmDialog, toast } from "@/components/notifications/alerts";
import { Appointment } from "@/types";
import { fmtDate, fmtTime } from "@/lib/utilities";
import { bucket } from "@/lib/utilities/appointments";

const TABS = ["Upcoming", "Pending", "Past", "Cancelled"] as const;
type Tab = (typeof TABS)[number];

export default function MyAppointmentsPage() {
  const { data, session, doctorById, cancelAppointment } = useApp();
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [q, setQ] = useState("");
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);

  const mine = useMemo(() => data.appointments.filter((a) => a.patientId === session?.userId).sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)), [data.appointments, session]);
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, mine.filter((a) => bucket(a) === t).length])) as Record<Tab, number>, [mine]);
  const list = mine.filter((a) => bucket(a) === tab && (!q || `${a.ref} ${doctorById(a.doctorId)?.name ?? ""} ${a.reason}`.toLowerCase().includes(q.toLowerCase())));
  const ordered = tab === "Upcoming" || tab === "Pending" ? [...list].reverse() : list;

  const cancel = async (a: Appointment) => {
    const d = doctorById(a.doctorId);
    if (await confirmDialog("Cancel this appointment?", `${d?.name ?? "Doctor"} - ${fmtDate(a.date)} at ${fmtTime(a.time)} (${a.ref}). The slot will be released.`, "Yes, cancel it", true)) {
      const r = cancelAppointment(a.id);
      if (!r.ok) toast("error", "Could not cancel", r.error);
      else toast("success", "Appointment cancelled", `${a.ref} has been cancelled.`);
    }
  };

  return (
    <>
      <PageHeader title="My Appointments" subtitle="Track, review, cancel, or reschedule your bookings." actions={<Link href="/patient/book" className="btn-primary">New booking</Link>} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? "bg-primary text-primary-fg shadow-glow" : "btn-ghost"}`}>{t} <span className="rounded-full bg-black/20 px-1.5 text-[10px]">{counts[t]}</span></button>)}
        </div>
        <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search reference or doctor" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search appointments" /></div>
      </div>
      {ordered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ordered.map((a) => (
            <AppointmentCard
              key={a.id}
              a={a}
              doctor={doctorById(a.doctorId)}
              onCancel={tab === "Cancelled" || tab === "Past" ? undefined : cancel}
              onReschedule={(appt) => setRescheduleAppt(appt)}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState title={`No ${tab.toLowerCase()} appointments`} text="Appointments will show up here as soon as they match this tab." action={<Link href="/patient/book" className="btn-primary btn-sm">Book an appointment</Link>} />
        </div>
      )}

      {rescheduleAppt && (
        <RescheduleModal
          a={rescheduleAppt}
          open={Boolean(rescheduleAppt)}
          onClose={() => setRescheduleAppt(null)}
        />
      )}
    </>
  );
}
