import Link from "next/link";
import { Accessibility, ArrowRight, BedDouble, Baby, Bone, Brain, CalendarDays, Eye, Flower2, Heart, HeartPulse, Leaf, Lightbulb, Monitor, Plus, ScanLine, Search, ShieldCheck, Siren, Smile, Sparkles, User } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { FACILITIES } from "@/lib/facilities";

function Ecg({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 20" className={`hidden h-5 w-20 text-primary sm:block ${flip ? "-scale-x-100" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M0 10h42l5-8 6 16 6-12 5 4h56" />
    </svg>
  );
}
export function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="inline-flex items-center gap-3 font-display text-2xl font-bold sm:text-3xl"><Ecg />{title}<Ecg flip /></h2>
      <p className="mt-1 text-sm text-muted">{sub}</p>
    </div>
  );
}

export function HomeHero() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-3 pt-4 sm:px-6 sm:pt-6">
      <div className="card home-hero-card relative isolate overflow-hidden !rounded-3xl border-line/40 !bg-[#071225] !bg-none lg:aspect-[3/1] lg:min-h-[460px]">
        {/* Full hero image: stacked above the text on small screens (never cropped), full-bleed 3:1 behind the text on large screens */}
        <div className="hero-media relative aspect-[16/9] sm:aspect-[2.2/1] w-full lg:absolute lg:inset-0 lg:-z-10 lg:aspect-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-night.jpg" alt="MEDIVANCE Hospital" className="h-full w-full object-cover object-center" />
          {/* Seamless gradient at the bottom of the photo on mobile */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#071225] to-transparent lg:hidden" />
          {/* Deep clean gradient on the left so background monolith sign never bleeds behind text */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-[#071225] from-45% via-[#071225]/90 via-62% to-transparent lg:block lg:w-[65%]" />
        </div>
        <div className="hero-content relative z-10 flex max-w-xl flex-col justify-center gap-4 p-6 sm:p-10 lg:h-full lg:py-6 lg:pl-12">
          <span className="on-dark"><Logo tagline size={44} /></span>
          <h1 className="font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-4xl xl:text-5xl"><>Experience Healthcare <span className="text-sky-300">Beyond</span> Expectations</></h1>
          <p className="max-w-md text-base text-white/90 sm:text-lg">Discover a modern healthcare environment designed around comfort, innovation and compassionate care.</p>
          <div><Link href="/inside" className="btn-primary !rounded-full !px-6 !py-3">Explore Our Hospital <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </div>
    </section>
  );
}

export function AmbianceGallery() {
  return (
    <section className="container-x py-10">
      <SectionHead title="Hospital Ambiance Gallery" sub="Explore our state-of-the-art facilities designed for your well-being." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {FACILITIES.map((f) => (
          <Link key={f.id} href={`/inside#${f.id}`} className="card-hover group relative block aspect-[2.2/1] overflow-hidden rounded-xl border border-line/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.img} alt={f.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-1.5 pt-6 text-[11px] font-semibold text-white"><f.icon className="h-3.5 w-3.5 shrink-0" />{f.short}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const DEPTS = [
  ["Cardiology", HeartPulse], ["Neurology", Brain], ["Dermatology", Sparkles], ["Pediatrics", Baby], ["Orthopedics", Bone],
  ["General Medicine", Plus], ["Gynecology", Flower2], ["Ophthalmology", Eye], ["Psychiatry", Lightbulb], ["Dentistry", Smile],
] as const;

export function Departments() {
  return (
    <section className="container-x py-10">
      <SectionHead title="Our Departments" sub="Comprehensive care across all major medical specialities." />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {DEPTS.map(([name, Icon]) => (
            <Link key={name} href={`/doctors?spec=${encodeURIComponent(name)}`} className="card card-hover flex flex-col items-center gap-2 !rounded-xl px-2 py-4 text-center text-sm font-semibold">
              <Icon className="h-7 w-7 text-primary" />{name}
            </Link>
          ))}
        </div>
        <Link href="/inside" aria-label="Advanced Medical Care with a Human Touch - Learn More" className="card card-hover group relative block aspect-[783/336] w-full overflow-hidden !rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/promo-care.jpg" alt="Advanced Medical Care with a Human Touch" className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]" />
        </Link>
      </div>
    </section>
  );
}

const FAC = [
  ["Modern Medical Equipment", Monitor], ["Advanced Diagnostic Facilities", ScanLine], ["Comfortable Patient Rooms", BedDouble], ["Professional Consultation Spaces", User],
  ["Emergency Care Facilities", Siren], ["Clean & Welcoming Environment", Leaf], ["Patient Privacy & Comfort", ShieldCheck], ["Accessible Facilities", Accessibility],
] as const;

export function WorldClassFacilities() {
  return (
    <section className="container-x py-10">
      <SectionHead title="World-Class Facilities" sub="Your comfort and care are our priority." />
      <div className="card grid grid-cols-2 !rounded-2xl sm:grid-cols-4 lg:grid-cols-8">
        {FAC.map(([name, Icon]) => (
          <div key={name} className="flex flex-col items-center gap-2 border-line/40 px-3 py-5 text-center text-xs font-medium lg:border-r lg:last:border-r-0">
            <Icon className="h-7 w-7 text-primary" />{name}
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  ["Discover MEDIVANCE", User, "/inside"], ["Find a Doctor", Search, "/doctors"], ["Book an Appointment", CalendarDays, "/patient/book"], ["Visit the Hospital", Heart, "/inside"], ["Continue Care with MyCare", HeartPulse, "/login"],
] as const;

export function PatientJourney() {
  return (
    <section className="container-x py-10">
      <SectionHead title="Your Patient Journey" sub="A seamless healthcare experience, from start to finish." />
      <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-5">
        {STEPS.map(([label, Icon, href], i) => (
          <Link key={label} href={href} className={`group relative flex flex-col items-center gap-3 text-center text-sm font-semibold ${i < STEPS.length - 1 ? "sm:after:absolute sm:after:left-[calc(50%+40px)] sm:after:top-7 sm:after:h-px sm:after:w-[calc(100%-80px)] sm:after:bg-primary/40" : ""}`}>
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-fg shadow-glow transition group-hover:scale-110"><Icon className="h-6 w-6" /></span>
            <span className="max-w-[130px]">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
