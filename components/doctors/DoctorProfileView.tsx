"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Briefcase, CalendarPlus, Clock, Globe, Star, Wallet } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { RatingSummary, ReviewForm } from "@/components/doctors/ReviewsExtras";
import EmptyState from "@/components/ui/EmptyState";
import { useApp } from "@/hooks/useApp";
import { fmtDate, fmtTime, money } from "@/lib/utilities";
import { WEEKDAYS } from "@/types";

export default function DoctorProfileView({ backHref = "/doctors" }: { backHref?: string }) {
  const { id } = useParams<{ id: string }>();
  const { doctorById, ready } = useApp();
  const d = doctorById(id);
  if (!ready) return null;
  if (!d) return <div className="card"><EmptyState title="Doctor not found" text="This profile may have been removed." action={<Link href={backHref} className="btn-primary btn-sm">Back to doctors</Link>} /></div>;

  return (
    <div className="space-y-5">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary"><ArrowLeft className="h-4 w-4" /> Back to doctors</Link>
      <section className="card flex flex-col gap-5 p-5 sm:flex-row sm:p-7">
        {d.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.photo} alt={d.name} className="aspect-[4/5] w-full max-w-[240px] shrink-0 self-center rounded-3xl object-cover object-top shadow-lg ring-2 ring-primary/30 sm:w-52 sm:self-start" />
        ) : <Avatar name={d.name} size={112} />}
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{d.name}</h1>
          <p className="text-sm text-muted">{d.qualification}</p>
          <span className="badge mt-2 border-primary/30 bg-primary/10 text-primary">{d.specialization}</span>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><p className="label">Experience</p><p className="inline-flex items-center gap-1 font-semibold"><Briefcase className="h-4 w-4 text-primary" /> {d.experience} years</p></div>
            <div><p className="label">Rating</p><p className="inline-flex items-center gap-1 font-semibold text-warn"><Star className="h-4 w-4 fill-current" /> {d.rating.toFixed(1)}</p></div>
            <div><p className="label">Fee</p><p className="inline-flex items-center gap-1 font-semibold"><Wallet className="h-4 w-4 text-primary" /> {money(d.fee)}</p></div>
            <div><p className="label">Languages</p><p className="inline-flex items-center gap-1 font-semibold"><Globe className="h-4 w-4 text-primary" /> {d.languages.join(", ")}</p></div>
          </div>
        </div>
        <Link href={`/patient/book?doctor=${d.id}`} className="btn-primary h-fit w-full self-start sm:w-auto sm:self-center"><CalendarPlus className="h-4 w-4" /> Book Appointment</Link>
      </section>
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{d.bio}</p>
          <h2 className="mb-3 mt-6 font-display text-lg font-semibold">Ratings & reviews</h2>
          <RatingSummary reviews={d.reviews} rating={d.rating} />
          <div className="space-y-3">
            {d.reviews.length === 0 && <p className="text-sm text-muted">No reviews yet.</p>}
            {d.reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-line/40 bg-primary/5 p-3">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold">{r.author}</span><span className="inline-flex items-center text-warn">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</span></div>
                <p className="mt-1 text-sm text-muted">{r.text}</p><p className="mt-1 text-[11px] text-muted">{fmtDate(r.date)}</p>
              </div>
            ))}
          </div>
          <ReviewForm doctorId={d.id} />
        </section>
        <section className="card h-fit p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><Clock className="h-5 w-5 text-primary" /> Weekly availability</h2>
          <ul className="space-y-2 text-sm">
            {WEEKDAYS.map((day) => {
              const w = d.availability.filter((x) => x.day === day);
              return (
                <li key={day} className="flex items-center justify-between gap-2 border-b border-line/30 pb-2 last:border-0">
                  <span className="font-semibold">{day}</span>
                  <span className={w.length ? "text-right" : "text-muted"}>{w.length ? w.map((x) => `${fmtTime(x.start)} - ${fmtTime(x.end)}`).join(", ") : "Off"}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">{d.slotMinutes}-minute slots. Pick a date while booking to see free times.</p>
        </section>
      </div>
    </div>
  );
}
