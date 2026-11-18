import { Bell, BrainCircuit, Clock, FileHeart, ShieldCheck, Smartphone } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

const ITEMS = [
  { icon: BrainCircuit, title: "AI-assisted search", text: "Describe what you need and get pointed to the right specialization." },
  { icon: ShieldCheck, title: "Verified specialists", text: "Every doctor profile lists qualifications, experience and patient reviews." },
  { icon: Clock, title: "No double bookings", text: "Live slot availability means one doctor, one patient, one slot." },
  { icon: Bell, title: "Instant updates", text: "Booking, approval and cancellation alerts keep everyone informed." },
  { icon: FileHeart, title: "Organised records", text: "Appointment history for patients, doctors and administrators in one place." },
  { icon: Smartphone, title: "Works on every device", text: "A responsive experience for phones, tablets and desktops." },
];

export default function WhyChoose() {
  return (
    <section className="container-x mt-20">
      <div className="mb-8 text-center"><p className="eyebrow">Why choose MEDIVANCE?</p><h2 className="section-title mt-2">Healthcare benefits that matter</h2></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((s, i) => (
          <Reveal key={s.title} delay={(i % 3) * 80}>
            <div className="card card-hover flex h-full gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><s.icon className="h-5 w-5" /></span>
              <div><h3 className="font-display font-bold">{s.title}</h3><p className="mt-1 text-sm text-muted">{s.text}</p></div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
