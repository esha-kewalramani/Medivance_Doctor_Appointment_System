"use client";
import { Activity, CalendarCheck, Stethoscope, Users } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import Reveal from "@/components/ui/Reveal";

export default function Stats() {
  const { data } = useApp();
  const items = [
    { icon: Stethoscope, label: "Registered Doctors", value: data.doctors.length },
    { icon: Users, label: "Registered Patients", value: data.patients.length },
    { icon: CalendarCheck, label: "Appointments Completed", value: data.appointments.filter((a) => a.status === "completed").length },
    { icon: Activity, label: "Available Specializations", value: data.specializations.length },
  ];
  return (
    <section className="container-x mt-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((s, i) => (
          <Reveal key={s.label} delay={i * 80}>
            <div className="card card-hover p-5 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><s.icon className="h-6 w-6" /></span>
              <p className="mt-3 font-display text-4xl font-extrabold">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">Sample frontend data from the demo dataset.</p>
    </section>
  );
}
