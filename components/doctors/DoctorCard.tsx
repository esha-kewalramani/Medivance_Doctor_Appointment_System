import Link from "next/link";
import { BadgeCheck, Briefcase, CalendarPlus, ChevronRight, CreditCard, MapPin, Star } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import FavoriteButton from "@/components/doctors/FavoriteButton";
import { Doctor } from "@/types";
import { money } from "@/lib/utilities";

/** Portrait doctor card: photo on top, details below. */
export default function DoctorCard({ doctor: d, profileBase = "/doctors" }: { doctor: Doctor; profileBase?: string }) {
  const available = d.availability.length > 0;
  return (
    <article className="card card-hover group relative flex flex-col overflow-hidden !rounded-3xl p-0">
      <div className="relative aspect-[4/4.4] w-full overflow-hidden bg-primary/10">
        {d.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.photo} alt={d.name} loading="lazy" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full w-full place-items-center"><Avatar name={d.name} size={120} /></div>
        )}
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow ${available ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}>
          <span className={`h-2 w-2 rounded-full ${available ? "bg-green-600" : "bg-slate-500"}`} /> {available ? "Available" : "Unavailable"}
        </span>
        <FavoriteButton doctorId={d.id} doctorName={d.name} />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="flex items-center justify-center gap-1.5 text-center font-display text-lg font-bold"><span className="truncate">{d.name}</span><BadgeCheck className="h-5 w-5 shrink-0 text-sky-500" /></h3>
        <p className="text-center text-sm font-medium text-primary">{d.specialization}</p>
        <div className="mt-3 grid grid-cols-2 divide-x divide-line/50 border-b border-line/40 pb-3 text-sm">
          <div className="flex items-center justify-center gap-2 pe-2"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /><span className="font-bold">{d.rating.toFixed(1)}</span></div>
          <div className="flex items-center justify-center gap-2 ps-2"><Briefcase className="h-5 w-5 text-primary" /><span className="font-semibold">{d.experience}+ Years</span></div>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /> Medivance General Hospital</li>
          <li className="flex items-center gap-2"><CreditCard className="h-4 w-4 shrink-0 text-primary" /> <span><b className="text-fg">{money(d.fee)}</b> / Consultation</span></li>
        </ul>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <Link href={`${profileBase}/${d.id}`} className="btn-primary !rounded-full">View Profile <ChevronRight className="h-4 w-4" /></Link>
          <Link href={`/patient/book?doctor=${d.id}`} className="btn-ghost !rounded-full !px-3" aria-label={`Book ${d.name}`}><CalendarPlus className="h-4 w-4" /></Link>
        </div>
      </div>
    </article>
  );
}
