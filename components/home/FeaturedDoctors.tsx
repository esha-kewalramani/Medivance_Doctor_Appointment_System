"use client";
import Link from "next/link";
import DoctorCard from "@/components/doctors/DoctorCard";
import Reveal from "@/components/ui/Reveal";
import { useApp } from "@/hooks/useApp";

export default function FeaturedDoctors() {
  const { data } = useApp();
  const top = [...data.doctors].sort((a, b) => b.rating - a.rating).slice(0, 4);
  return (
    <section className="container-x mt-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Featured doctors</p><h2 className="section-title mt-2">Meet our top-rated specialists</h2></div>
        <Link href="/doctors" className="btn-ghost">View all doctors</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {top.map((d, i) => <Reveal key={d.id} delay={i * 80}><DoctorCard doctor={d} /></Reveal>)}
      </div>
    </section>
  );
}
