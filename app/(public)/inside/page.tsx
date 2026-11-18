"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { PatientJourney, SectionHead, WorldClassFacilities } from "@/components/home/Experience";
import { FACILITIES, Facility } from "@/lib/facilities";

export default function InsidePage() {
  const [open, setOpen] = useState<Facility | null>(null);
  return (
    <>
      <section className="container-x pt-8 text-center">
        <p className="eyebrow">Hospital experience</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Inside <span className="text-accent">MEDIVANCE</span> Hospital</h1>
        <p className="mx-auto mt-3 max-w-2xl text-fg/80">A look at the spaces designed around comfort, safety and compassionate care, from the first welcome at reception to recovery in the healing garden.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/patient/book" className="btn-primary !rounded-full !px-6"><CalendarDays className="h-4 w-4" /> Book an appointment</Link>
          <Link href="/doctors" className="btn-ghost !rounded-full !px-6">Meet our doctors <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="container-x py-10">
        <SectionHead title="Hospital Ambiance Gallery" sub="Tap any space to see it larger." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FACILITIES.map((f, i) => (
            <article key={f.id} id={f.id} className="card card-hover scroll-mt-28 overflow-hidden !rounded-2xl">
              <button onClick={() => setOpen(f)} className="block w-full text-left" aria-label={`Enlarge ${f.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.img} alt={f.title} loading="lazy" className="aspect-[16/8] w-full object-cover" />
              </button>
              <div className="p-5">
                <div className="mb-1 flex items-center gap-2 text-primary"><f.icon className="h-5 w-5" /><span className="text-xs font-bold tracking-widest">{String(i + 1).padStart(2, "0")}</span></div>
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.desc}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted">Official facility photography & architectural visual references for MEDIVANCE medical center.</p>
      </section>

      <WorldClassFacilities />
      <PatientJourney />

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""} wide>
        {open && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.img} alt={open.title} className="w-full rounded-xl" />
            <p className="text-sm text-muted">{open.desc}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
