import { HeartPulse, Target, Users } from "lucide-react";
import Link from "next/link";

const CARDS = [
  { icon: Target, title: "Our mission", text: "Make booking a doctor as simple and reliable as sending a message, for patients and clinics alike." },
  { icon: HeartPulse, title: "Our approach", text: "Combine clear scheduling, role-based portals and AI-assisted discovery so people find the right care faster." },
  { icon: Users, title: "Our team", text: "A university project team building a Supabase-ready healthcare appointment platform in a 14-day sprint." },
];

export default function AboutPage() {
  return (
    <div className="container-x pt-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">About us</p>
        <h1 className="section-title mt-2">Healthcare technology built around people</h1>
        <p className="mt-4 text-muted">MEDIVANCE connects patients, doctors and administrators through one intelligent appointment system. This frontend phase demonstrates the complete experience with sample data; a Supabase backend comes next.</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.title} className="card card-hover p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><c.icon className="h-6 w-6" /></span>
            <h2 className="mt-4 font-display text-xl font-bold">{c.title}</h2>
            <p className="mt-2 text-sm text-muted">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center"><Link href="/login" className="btn-primary">Get started</Link></div>
    </div>
  );
}
