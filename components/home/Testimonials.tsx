import { Quote, Star } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Reveal from "@/components/ui/Reveal";

const T = [
  { name: "Ayesha Khan", role: "Patient, Hyderabad", text: "I booked a cardiologist in two minutes and saw exactly which slots were free. No phone calls, no waiting." },
  { name: "Bilal Raza", role: "Patient, Karachi", text: "The doctor approved my request quickly and I got a notification straight away. Very smooth experience." },
  { name: "Dr. Nadia Hussain", role: "General Physician", text: "Managing my availability and approving requests from one dashboard saves me a lot of admin time." },
];

export default function Testimonials() {
  return (
    <section className="container-x mt-20">
      <div className="mb-8 text-center"><p className="eyebrow">Testimonials</p><h2 className="section-title mt-2">What people say</h2><p className="mt-1 text-xs text-muted">Sample testimonials for the demo.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        {T.map((t, i) => (
          <Reveal key={t.name} delay={i * 90}>
            <figure className="card relative h-full p-6">
              <Quote className="absolute right-5 top-5 h-8 w-8 text-primary/20" />
              <div className="flex text-warn">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}</div>
              <blockquote className="mt-3 text-sm leading-relaxed text-fg/90">&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3"><Avatar name={t.name} size={40} /><span><span className="block text-sm font-semibold">{t.name}</span><span className="text-xs text-muted">{t.role}</span></span></figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
