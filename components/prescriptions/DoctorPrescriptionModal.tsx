"use client";
import { useState } from "react";
import {
  FileText,
  Plus,
  Pill,
  Trash2,
  X,
  ShieldCheck,
} from "lucide-react";
import { Prescription, PrescriptionItem, QueueToken } from "@/types";
import { useApp } from "@/hooks/useApp";
import { toast } from "@/components/notifications/alerts";
import { todayISO } from "@/lib/utilities";

interface DoctorPrescriptionModalProps {
  token?: QueueToken | null;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (prescription: Prescription) => void;
}

const COMMON_DRUGS: Array<{ name: string; dosage: string; frequency: string; duration: string; instructions: string }> = [
  { name: "Augmentin (Amoxicillin/Clav)", dosage: "625mg", frequency: "Twice daily (1-0-1)", duration: "5 Days", instructions: "After meals" },
  { name: "Panadol (Paracetamol)", dosage: "500mg", frequency: "Thrice daily (1-1-1)", duration: "3 Days", instructions: "For fever/pain" },
  { name: "Omeprazole (Risek)", dosage: "20mg", frequency: "Once daily (1-0-0)", duration: "14 Days", instructions: "30 mins before breakfast" },
  { name: "Cetirizine (Zyrtec)", dosage: "10mg", frequency: "Once at night (0-0-1)", duration: "7 Days", instructions: "Before sleep" },
  { name: "Brufen (Ibuprofen)", dosage: "400mg", frequency: "Twice daily (1-0-1)", duration: "3 Days", instructions: "After food" },
];

export default function DoctorPrescriptionModal({
  token,
  patientId,
  patientName,
  doctorId,
  doctorName,
  open,
  onClose,
  onSuccess,
}: DoctorPrescriptionModalProps) {
  const { addPrescription } = useApp();

  const [diagnosis, setDiagnosis] = useState(token?.triageBrief?.chiefComplaint || "Acute symptomatic evaluation");
  const [medications, setMedications] = useState<PrescriptionItem[]>([
    { name: "Augmentin", dosage: "625mg", frequency: "Twice daily (1-0-1)", duration: "5 Days", instructions: "After meals" },
  ]);
  const [instructions, setInstructions] = useState("Drink plenty of warm water. Rest adequately and return for review if symptoms persist.");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleAddMedication = () => {
    setMedications((prev) => [
      ...prev,
      { name: "", dosage: "", frequency: "Twice daily (1-0-1)", duration: "5 Days", instructions: "After meals" },
    ]);
  };

  const handleRemoveMedication = (idx: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMed = (idx: number, field: keyof PrescriptionItem, val: string) => {
    setMedications((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m))
    );
  };

  const addPresetDrug = (drug: typeof COMMON_DRUGS[0]) => {
    setMedications((prev) => [...prev, { ...drug }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMeds = medications.filter((m) => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      toast("error", "Add Medications", "Please add at least one medication to the prescription.");
      return;
    }

    setLoading(true);
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const rxNumber = `RX-${new Date().getFullYear()}-${randomSeq}`;

    const res = addPrescription({
      rxNumber,
      appointmentId: token?.appointmentId,
      patientId,
      doctorId,
      doctorName,
      diagnosis,
      date: todayISO(),
      medications: validMeds,
      instructions,
    });

    setLoading(false);
    if (res.ok && res.prescription) {
      toast("success", "Prescription Issued", `Rx #${rxNumber} generated and verified.`);
      onSuccess(res.prescription);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl backdrop-blur-2xl transition-all dark:border-cyan-500/40 dark:bg-[#06152b] dark:text-slate-100">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-cyan-500/20">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-700 dark:bg-cyan-950/80 dark:border dark:border-cyan-400/40 dark:text-cyan-300">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Write Smart Digital Prescription
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For: <strong className="text-teal-700 dark:text-cyan-400">{patientName}</strong> • Attending: {doctorName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Diagnosis Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Diagnosis
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acute Bronchitis, Type 2 Diabetes, Migraine"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none focus:border-cyan-600 focus:bg-white dark:border-[#153457] dark:bg-[#040f21] dark:text-white"
            />
          </div>

          {/* Quick-Add Formulary Pill Buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              + Fast Formulary Presets (1-Click Add):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DRUGS.map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => addPresetDrug(d)}
                  className="py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[10.5px] font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-300 dark:border-[#153457] dark:bg-[#081a33] dark:text-slate-300 dark:hover:border-cyan-400"
                >
                  + {d.name} ({d.dosage})
                </button>
              ))}
            </div>
          </div>

          {/* Prescription Medicines List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Medications List ({medications.length})</span>
              <button
                type="button"
                onClick={handleAddMedication}
                className="text-teal-700 dark:text-cyan-400 flex items-center gap-1 hover:underline text-[11px]"
              >
                <Plus className="h-3.5 w-3.5" /> Add Medication
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {medications.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 dark:border-cyan-500/20 dark:bg-[#040f21]/80 space-y-2"
                >
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      value={m.name}
                      onChange={(e) => updateMed(idx, "name", e.target.value)}
                      className="col-span-5 h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-[#071933] dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={m.dosage}
                      onChange={(e) => updateMed(idx, "dosage", e.target.value)}
                      className="col-span-3 h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-[#071933] dark:text-white"
                    />
                    <select
                      value={m.frequency}
                      onChange={(e) => updateMed(idx, "frequency", e.target.value)}
                      className="col-span-3 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-[#071933] dark:text-white"
                    >
                      <option value="Twice daily (1-0-1)">Twice (1-0-1)</option>
                      <option value="Once daily (1-0-0)">Once (1-0-0)</option>
                      <option value="Thrice daily (1-1-1)">Thrice (1-1-1)</option>
                      <option value="At night (0-0-1)">Night (0-0-1)</option>
                      <option value="As needed (SOS)">SOS (As needed)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(idx)}
                      className="col-span-1 grid place-items-center text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 5 Days)"
                      value={m.duration}
                      onChange={(e) => updateMed(idx, "duration", e.target.value)}
                      className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-900 dark:border-slate-700 dark:bg-[#071933] dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Advice (e.g. After meals)"
                      value={m.instructions || ""}
                      onChange={(e) => updateMed(idx, "instructions", e.target.value)}
                      className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-900 dark:border-slate-700 dark:bg-[#071933] dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Advice Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Dietary Advice & Special Instructions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none focus:border-cyan-600 focus:bg-white dark:border-[#153457] dark:bg-[#040f21] dark:text-white"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 text-white text-xs sm:text-sm font-bold shadow-md hover:brightness-105 active:scale-[0.99] transition disabled:opacity-70 dark:from-[#0072ff] dark:to-[#00b4d8] dark:shadow-[0_0_20px_rgba(0,180,216,0.4)]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating Verified Prescription...
                </span>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Issue & Cryptographically Sign Prescription</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
