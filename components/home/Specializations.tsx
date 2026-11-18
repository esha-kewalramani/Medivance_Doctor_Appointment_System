"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SpecIcon from "@/components/ui/SpecIcon";
import Reveal from "@/components/ui/Reveal";
import { useApp } from "@/hooks/useApp";

export default function Specializations() {
  const { data } = useApp();
  return (
    <section id="specializations" className="container-x mt-20 scroll-mt-28">
      <div className="mb-8 text-center"><p className="eyebrow">Specializations</p><h2 className="section-title mt-2">Care for every need</h2></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.specializations.map((s, i) => {
          const n = data.doctors.filter((d) => d.specialization === s.name).length;
          return (
            <Reveal key={s.id} delay={(i % 4) * 70}>
              <Link href={`/doctors?spec=${encodeURIComponent(s.name)}`} className="card card-hover group block h-full p-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-primary-fg"><SpecIcon name={s.icon} className="h-6 w-6" /></span>
                <h3 className="mt-4 font-display text-lg font-bold">{s.name}</h3>
                <p className="mt-1 text-sm text-muted">{s.description}</p>
                <p className="mt-3 flex items-center justify-between text-sm font-semibold text-primary">{n} doctor{n === 1 ? "" : "s"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></p>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
