"use client";
import Link from "next/link";
import { useMemo } from "react";
import { CalendarClock, Heart, History } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { useFavorites } from "@/hooks/useFavorites";
import { fmtDate, fmtTime, todayISO } from "@/lib/utilities";

/** Patient dashboard card: upcoming visits, past visits and saved doctors. */
export default function HealthSummary() {
  const { data, session, doctorById } = useApp();
  const { ids } = useFavorites();
  const today = todayISO();
  const mine = useMemo(() => data.appointments.filter((a) => a.patientId === session?.userId), [data.appointments, session]);
  const upcoming = mine.filter((a) => ["pending", "approved"].includes(a.status) && a.date >= today).sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1)).slice(0, 3);
  const past = mine.filter((a) => a.status === "completed").sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)).slice(0, 3);
  const saved = ids.map((id) => doctorById(id)).filter(Boolean).slice(0, 4);

  const Row = ({ a }: { a: (typeof mine)[number] }) => {
    const d = doctorById(a.doctorId);
    return (
      <li className="flex items-center gap-2.5 text-sm">
        <Avatar name={d?.name ?? "Doctor"} photo={d?.photo} size={32} />
        <span className="min-w-0"><span className="block truncate font-medium">{d?.name ?? "Doctor"}</span><span className="text-xs text-muted">{fmtDate(a.date)} - {fmtTime(a.time)}</span></span>
      </li>
    );
  };

  return (
    <section className="card p-5" aria-labelledby="health-summary">
      <h2 id="health-summary" className="mb-4 font-display text-lg font-semibold">Health summary</h2>
      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <h3 className="label flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> Upcoming visits</h3>
          {upcoming.length ? <ul className="space-y-2.5">{upcoming.map((a) => <Row key={a.id} a={a} />)}</ul> : <p className="text-sm text-muted">No upcoming visits. <Link href="/patient/book" className="font-semibold text-primary">Book one</Link></p>}
        </div>
        <div>
          <h3 className="label flex items-center gap-1.5"><History className="h-4 w-4" /> Past visits</h3>
          {past.length ? <ul className="space-y-2.5">{past.map((a) => <Row key={a.id} a={a} />)}</ul> : <p className="text-sm text-muted">Completed visits will appear here.</p>}
        </div>
        <div>
          <h3 className="label flex items-center gap-1.5"><Heart className="h-4 w-4" /> Saved doctors</h3>
          {saved.length ? (
            <ul className="space-y-2.5">{saved.map((d) => d && (
              <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                <Link href={`/patient/doctors/${d.id}`} className="flex min-w-0 items-center gap-2.5 hover:text-primary"><Avatar name={d.name} photo={d.photo} size={32} /><span className="min-w-0"><span className="block truncate font-medium">{d.name}</span><span className="text-xs text-muted">{d.specialization}</span></span></Link>
                <Link href={`/patient/book?doctor=${d.id}`} className="btn-ghost btn-sm shrink-0">Rebook</Link>
              </li>
            ))}</ul>
          ) : <p className="text-sm text-muted">Tap the heart on a doctor card to save them here. <Link href="/patient/doctors" className="font-semibold text-primary">Find doctors</Link></p>}
        </div>
      </div>
    </section>
  );
}
