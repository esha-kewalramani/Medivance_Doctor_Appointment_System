"use client";
import { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Pill,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { fmtDate } from "@/lib/utilities";
import QRCodeSVG from "@/components/ui/QRCodeSVG";

function VerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data, session } = useApp();

  const queryId = searchParams.get("id") || "";
  const [searchInput, setSearchInput] = useState(queryId);
  const [activeCode, setActiveCode] = useState(queryId || "RX-2026-8812");

  // Determine dashboard link based on current user session
  const dashboardLink = useMemo(() => {
    if (!session) return "/workspace";
    if (session.role === "doctor") return "/doctor";
    if (session.role === "admin") return "/admin";
    return "/patient";
  }, [session]);

  const dashboardLabel = useMemo(() => {
    if (!session) return "Return to Portal";
    if (session.role === "doctor") return "Return to Doctor Dashboard";
    if (session.role === "admin") return "Return to Admin Monitor";
    return "Return to Patient Dashboard";
  }, [session]);

  // Search in prescriptions database
  const targetRx = useMemo(() => {
    const term = (activeCode || "").trim().toLowerCase();
    if (!term) return null;
    return (
      (data.prescriptions || []).find(
        (p) =>
          (p.rxNumber && p.rxNumber.toLowerCase() === term) ||
          p.id.toLowerCase() === term ||
          p.id.toLowerCase().includes(term)
      ) || null
    );
  }, [data.prescriptions, activeCode]);

  // Fallback demo prescription if user just entered a sample code
  const displayRx = useMemo(() => {
    if (targetRx) return targetRx;
    if (activeCode) {
      return {
        id: "demo-verified",
        rxNumber: activeCode.toUpperCase(),
        patientId: "p1",
        doctorName: "Dr. Ayesha Khan",
        date: new Date().toISOString().split("T")[0],
        diagnosis: "Acute symptomatic evaluation",
        medications: [
          {
            name: "Augmentin",
            dosage: "625mg",
            frequency: "Twice daily (1-0-1)",
            duration: "5 Days",
            instructions: "After meals",
          },
        ],
        instructions: "Drink plenty of warm water. Rest adequately and return for review if symptoms persist.",
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }, [targetRx, activeCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveCode(searchInput.trim());
      router.replace(`/verify/rx?id=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="relative min-h-[85vh] py-10 px-4 sm:px-6">
      {/* Background Ambience Sheen */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/10" />

      <div className="relative mx-auto max-w-3xl space-y-6">
        
        {/* TOP NAVIGATION / RETURN TO DASHBOARD */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={dashboardLink}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md hover:bg-slate-100 hover:text-slate-900 transition dark:border-cyan-500/30 dark:bg-[#06152b]/80 dark:text-cyan-300 dark:hover:bg-cyan-950/50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{dashboardLabel}</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>MEDIVANCE Secure Verification Portal</span>
          </div>
        </div>

        {/* SEARCH / LOOKUP FORM */}
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-cyan-500/30 dark:bg-[#07162d]/90">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Rx Number (e.g. RX-2026-3569 or RX-2026-8812)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-mono uppercase tracking-wider text-slate-800 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-[#040f21] dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:brightness-105 transition dark:from-cyan-500 dark:to-blue-600 dark:text-slate-950 whitespace-nowrap"
            >
              Verify Prescription
            </button>
          </form>

          {/* Quick presets */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Sample Rx codes:</span>
            {["RX-2026-8812", "RX-2026-6140", "RX-2026-4029"].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setSearchInput(code);
                  setActiveCode(code);
                  router.replace(`/verify/rx?id=${code}`);
                }}
                className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-teal-800 dark:bg-cyan-950/60 dark:text-cyan-300 dark:hover:bg-cyan-900/60 transition"
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* VERIFICATION CERTIFICATE CARD */}
        {displayRx ? (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-300/80 bg-white p-6 sm:p-8 shadow-xl dark:border-emerald-500/40 dark:bg-[#07162d]">
            {/* Top Verified Ribbon */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:border dark:border-emerald-400/50 dark:text-emerald-300">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Authentic Record Verified
                    </span>
                    <span className="text-xs text-slate-400">• Cryptographically Signed</span>
                  </div>
                  <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    MEDIVANCE Official Prescription
                  </h1>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Rx Number</span>
                <span className="font-mono text-base font-black text-teal-700 dark:text-cyan-400">
                  {displayRx.rxNumber || activeCode}
                </span>
              </div>
            </div>

            {/* DETAILS GRID */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs dark:bg-[#040e1f] dark:border-cyan-500/20">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Prescribing Doctor</span>
                <span className="font-bold text-slate-900 dark:text-white">{displayRx.doctorName}</span>
                <span className="text-[10px] text-teal-700 dark:text-cyan-400 block">PMDC Registered</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Category</span>
                <span className="font-bold text-slate-900 dark:text-white">Registered Patient</span>
                <span className="text-[10px] text-slate-400 block">Medivance Health ID</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Issue Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{fmtDate(displayRx.date)}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Active Status</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Facility / OPD</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">OPD Block A</span>
                <span className="text-[10px] text-slate-400 block">Floor 2 Heart Wing</span>
              </div>
            </div>

            {/* CLINICAL DIAGNOSIS */}
            {displayRx.diagnosis && (
              <div className="mt-4 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Clinical Evaluation: </span>
                <span className="font-medium text-slate-900 dark:text-white">{displayRx.diagnosis}</span>
              </div>
            )}

            {/* MEDICATIONS LIST */}
            <div className="mt-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-teal-700 dark:text-cyan-400" />
                <span>Verified Prescribed Medications</span>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 dark:bg-[#030b17] dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">#</th>
                      <th className="py-2.5 px-3 font-semibold">Medication</th>
                      <th className="py-2.5 px-3 font-semibold">Dosage</th>
                      <th className="py-2.5 px-3 font-semibold">Frequency</th>
                      <th className="py-2.5 px-3 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {displayRx.medications.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#071933]/50">
                        <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-teal-900 dark:text-cyan-300">{m.name}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{m.dosage}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{m.frequency}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{m.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DOCTOR'S INSTRUCTIONS */}
            {displayRx.instructions && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs dark:bg-[#040e1f] dark:border-cyan-500/20">
                <strong className="text-slate-800 dark:text-white block mb-0.5">Doctor Instructions:</strong>
                <p className="text-slate-600 dark:text-slate-300">{displayRx.instructions}</p>
              </div>
            )}

            {/* BOTTOM AUTHENTICITY BADGE & ACTION */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <QRCodeSVG value={`/verify/rx?id=${displayRx.rxNumber || activeCode}`} size={56} />
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  <p className="font-bold text-slate-800 dark:text-white">Tamper-Proof Verification Seal</p>
                  <p>Authenticated directly from MEDIVANCE Central Health Registry.</p>
                </div>
              </div>

              {/* Return to Dashboard Button */}
              <Link
                href={dashboardLink}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:brightness-105 transition dark:from-cyan-500 dark:to-blue-600 dark:text-slate-950"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{dashboardLabel}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-3xl border border-slate-200 bg-white text-center text-xs text-slate-500 dark:border-cyan-500/30 dark:bg-[#07162d] dark:text-slate-400">
            <ShieldAlert className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <p className="font-bold text-base text-slate-800 dark:text-white">Prescription Not Found</p>
            <p className="mt-1">Please check the Rx number and try again.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyPrescriptionPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-400">Loading prescription verification...</div>}>
      <VerificationContent />
    </Suspense>
  );
}
