import { CalendarCheck, CheckCircle2, Search, UserPlus } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

const STEPS = [
  { icon: UserPlus, title: "Create your account", text: "Register as a patient in under a minute with your basic details." },
  { icon: Search, title: "Find the right doctor", text: "Search, filter by specialty or use AI Doctor Match to narrow your options." },
  { icon: CalendarCheck, title: "Pick a free slot", text: "Choose a date and a time. Taken slots never appear as available." },
  { icon: CheckCircle2, title: "Get confirmation", text: "The doctor approves your request and you are notified instantly." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="container-x mt-20 scroll-mt-28">
      <div className="mb-8 text-center"><p className="eyebrow">How it works</p><h2 className="section-title mt-2">Booking in four simple steps</h2></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 90}>
            <div className="card relative h-full p-6">
              <span className="absolute right-4 top-3 font-display text-5xl font-extrabold text-primary/10">{i + 1}</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/20 text-accent"><s.icon className="h-6 w-6" /></span>
              <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
