"use client";
import { Printer, X, ShieldCheck, ArrowLeft, ExternalLink } from "lucide-react";
import { Prescription } from "@/types";
import QRCodeSVG from "@/components/ui/QRCodeSVG";
import { fmtDate } from "@/lib/utilities";

interface PrescriptionViewModalProps {
  prescription: Prescription;
  patientName?: string;
  patientGender?: string;
  doctorSpecialization?: string;
  open: boolean;
  onClose: () => void;
}

export default function PrescriptionViewModal({
  prescription,
  patientName = "Registered Patient",
  patientGender = "Adult",
  doctorSpecialization = "Specialist Physician",
  open,
  onClose,
}: PrescriptionViewModalProps) {
  if (!open) return null;

  const rxNum = prescription.rxNumber || `RX-${prescription.id.slice(0, 8).toUpperCase()}`;
  const verifyPath = `/verify/rx?id=${rxNum}`;
  const verifyFullUrl = typeof window !== "undefined" ? `${window.location.origin}${verifyPath}` : `https://medivance.org${verifyPath}`;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center print:p-0 print:bg-white">
      
      {/* Modal / Paper Container */}
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl text-slate-800 transition-all dark:border-cyan-500/30 dark:bg-[#07152b] dark:text-slate-100 print:border-none print:shadow-none print:p-6 print:max-w-none print:text-black">
        
        {/* Actions Bar (Hidden during actual print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-cyan-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Official Digital Prescription</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 text-white text-xs font-semibold shadow-xs hover:brightness-105 active:scale-95 transition dark:from-cyan-500 dark:to-blue-600 dark:text-slate-950"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-cyan-500/30 dark:bg-[#06152b] dark:text-cyan-300 dark:hover:bg-cyan-950/60 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ======================================================= */}
        {/* OFFICIAL PRESCRIPTION SLIP CONTENT                     */}
        {/* ======================================================= */}
        <div className="space-y-5 print:space-y-4">
          
          {/* 1. HOSPITAL & DOCTOR HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-slate-800 dark:border-cyan-400/60 print:border-black">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-700 text-white font-bold text-lg dark:bg-cyan-500 dark:text-slate-950 print:bg-black print:text-white">
                  M
                </span>
                <span className="font-serif text-2xl font-black tracking-tight text-[#0b2545] dark:text-white print:text-black">
                  MEDIVANCE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 print:text-gray-600">
                Tertiary Care Hospital & Digital Health Center
              </p>
              <p className="text-[10px] text-slate-400 print:text-gray-500">
                OPD Block A • Phone: +92 300 123 4567 • info@medivance.pk
              </p>
            </div>

            <div className="sm:text-right">
              <h3 className="font-bold text-base text-slate-900 dark:text-white print:text-black">
                {prescription.doctorName}
              </h3>
              <p className="text-xs font-medium text-teal-700 dark:text-cyan-400 print:text-gray-700">
                {doctorSpecialization}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 print:text-gray-500">
                PMDC Verified License • Reg #MED-74921
              </p>
            </div>
          </div>

          {/* 2. PATIENT & VISIT METADATA STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs dark:bg-[#040f21] dark:border-cyan-500/20 print:bg-gray-50 print:border-gray-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
              <span className="font-bold text-slate-900 dark:text-white print:text-black">{patientName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender / Category</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 print:text-black">{patientGender}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Prescription Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 print:text-black">{fmtDate(prescription.date)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Rx Number</span>
              <span className="font-mono font-bold text-teal-700 dark:text-cyan-400 print:text-black">{rxNum}</span>
            </div>
          </div>

          {/* Diagnosis if available */}
          {prescription.diagnosis && (
            <div className="text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Clinical Diagnosis: </span>
              <span className="font-semibold text-teal-800 dark:text-cyan-300 print:text-black">{prescription.diagnosis}</span>
            </div>
          )}

          {/* 3. RX SYMBOL & MEDICATION TABLE */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2 font-serif text-3xl font-black text-teal-700 dark:text-cyan-400 print:text-black">
              <span>℞</span>
              <span className="text-xs font-sans uppercase font-bold text-slate-400 tracking-wider">
                Prescribed Medications
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800 print:border-gray-300">
                <thead className="bg-slate-100 text-slate-700 dark:bg-[#041022] dark:text-slate-300 print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">#</th>
                    <th className="py-2.5 px-3 font-bold">Medicine & Dosage</th>
                    <th className="py-2.5 px-3 font-bold">Frequency</th>
                    <th className="py-2.5 px-3 font-bold">Duration</th>
                    <th className="py-2.5 px-3 font-bold">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-gray-200">
                  {prescription.medications.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#081a33]/50">
                      <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-teal-900 dark:text-cyan-300 print:text-black">
                        {m.name} <span className="font-normal text-slate-600 dark:text-slate-400">({m.dosage})</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 print:text-black">{m.frequency}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 print:text-black">{m.duration}</td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 italic print:text-gray-600">
                        {m.instructions || "After meals"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. DOCTOR'S ADVICE & DIETARY INSTRUCTIONS */}
          {prescription.instructions && (
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 text-xs dark:bg-[#040f21] dark:border-cyan-500/20 print:bg-gray-50 print:border-gray-200">
              <span className="font-bold text-slate-800 dark:text-white block mb-0.5 print:text-black">
                Doctor&apos;s Advice & Diet Instructions:
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed print:text-gray-700">
                {prescription.instructions}
              </p>
            </div>
          )}

          {/* 5. FOOTER: VERIFICATION QR CODE & DIGITAL SEAL */}
          <div className="pt-4 border-t-2 border-slate-200 dark:border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 print:border-gray-300">
            {/* Scannable & Clickable QR Code */}
            <div className="flex items-center gap-3">
              <a
                href={verifyPath}
                target="_blank"
                rel="noopener noreferrer"
                title="Click to open online verification page"
                className="group relative p-1 rounded-xl bg-white border border-slate-200 hover:border-cyan-400 dark:border-slate-700 transition"
              >
                <QRCodeSVG value={verifyFullUrl} size={70} />
              </a>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 print:text-gray-600">
                <p className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 print:text-black">
                  Official Verification QR
                </p>
                <p>Scan with camera or click below to verify online.</p>
                <a
                  href={verifyPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9px] text-teal-700 dark:text-cyan-400 hover:underline mt-0.5 inline-flex items-center gap-1 font-bold print:hidden"
                >
                  <span>Verify Online ↗ ({rxNum})</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>

            {/* Doctor's Signature Seal */}
            <div className="text-center sm:text-right">
              <div className="inline-block p-2 rounded-xl border border-teal-300/80 bg-teal-50/50 dark:border-cyan-400/40 dark:bg-cyan-950/40 text-[10px] text-teal-800 dark:text-cyan-300 mb-1 print:border-black print:text-black">
                <span className="font-serif font-black tracking-wider block">DIGITALLY CERTIFIED</span>
                <span>Signature Token: #{rxNum}</span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-white print:text-black">{prescription.doctorName}</p>
              <p className="text-[10px] text-slate-400 print:text-gray-500">Electronically signed via MEDIVANCE Health ID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
