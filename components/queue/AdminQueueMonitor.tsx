"use client";
import { Radio } from "lucide-react";
import { useLiveQueue } from "@/hooks/useLiveQueue";
import { todayISO } from "@/lib/utilities";

export default function AdminQueueMonitor() {
  const { tokens } = useLiveQueue();
  const today = todayISO();
  const todaysTokens = tokens.filter((t) => t.date === today);

  const waiting = todaysTokens.filter((t) => t.status === "waiting").length;
  const inConsult = todaysTokens.filter((t) => t.status === "calling" || t.status === "in_consultation").length;
  const completed = todaysTokens.filter((t) => t.status === "completed").length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-cyan-500/30 dark:bg-[#06152b]/90 dark:shadow-[0_0_30px_rgba(0,180,216,0.18)]">
      {/* Ambience Sheen */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/15" />

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-teal-700 dark:bg-cyan-950/80 dark:border dark:border-cyan-400/40 dark:text-cyan-300">
            <Radio className="h-5 w-5 animate-pulse text-cyan-600 dark:text-cyan-400" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-white">
                Hospital OPD Queue & Floor Monitor
              </h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live hospital throughput, waiting rooms, and doctor room occupancy
            </p>
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-cyan-500/20 dark:bg-[#041022]/80">
          <p className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Tokens Today</p>
          <p className="font-serif text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{todaysTokens.length}</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-950/30">
          <p className="text-[10.5px] uppercase font-bold text-amber-700 dark:text-amber-400">Currently In Queue</p>
          <p className="font-serif text-2xl font-bold text-amber-800 dark:text-amber-300 mt-0.5">{waiting}</p>
        </div>

        <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-3 dark:border-cyan-500/20 dark:bg-cyan-950/30">
          <p className="text-[10.5px] uppercase font-bold text-cyan-700 dark:text-cyan-400">Active Consultations</p>
          <p className="font-serif text-2xl font-bold text-cyan-800 dark:text-cyan-300 mt-0.5">{inConsult}</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-950/30">
          <p className="text-[10.5px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Completed Visits</p>
          <p className="font-serif text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">{completed}</p>
        </div>
      </div>

      {/* ACTIVE QUEUE TABLE */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-cyan-500/20 text-slate-500 dark:text-slate-400">
              <th className="py-2 px-3 font-semibold">Token</th>
              <th className="py-2 px-3 font-semibold">Patient</th>
              <th className="py-2 px-3 font-semibold">Doctor & Specialty</th>
              <th className="py-2 px-3 font-semibold">Room</th>
              <th className="py-2 px-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {todaysTokens.slice(0, 6).map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-[#071933]/50">
                <td className="py-2.5 px-3 font-serif font-bold text-teal-700 dark:text-cyan-400">
                  #{t.tokenNumber}
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-white">
                  {t.patientName}
                </td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                  {t.doctorName} <span className="text-slate-400">({t.specialization})</span>
                </td>
                <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                  {t.room}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      t.status === "calling"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/30 dark:text-emerald-300 animate-pulse"
                        : t.status === "in_consultation"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-500/30 dark:text-blue-300"
                        : t.status === "completed"
                        ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        : "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300"
                    }`}
                  >
                    {t.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
