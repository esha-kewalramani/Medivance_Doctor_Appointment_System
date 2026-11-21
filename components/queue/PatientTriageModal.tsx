"use client";
import { useState } from "react";
import {
  Check,
  Sparkles,
  X,
} from "lucide-react";
import { QueueToken, TriageBrief } from "@/types";
import { toast } from "@/components/notifications/alerts";

interface PatientTriageModalProps {
  token: QueueToken;
  open: boolean;
  onClose: () => void;
  onSubmit: (brief: TriageBrief) => void;
}

const COMMON_SYMPTOMS = [
  "Fever",
  "Cough",
  "Chest Pain",
  "Headache",
  "Stomach Ache",
  "Shortness of Breath",
  "Sore Throat",
  "Back Pain",
  "Fatigue",
  "Skin Rash",
];

export default function PatientTriageModal({
  token,
  open,
  onClose,
  onSubmit,
}: PatientTriageModalProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [complaintText, setComplaintText] = useState("");
  const [duration, setDuration] = useState("2-3 Days");
  const [painLevel, setPainLevel] = useState<number>(4);
  const [hasAllergies, setHasAllergies] = useState<boolean>(false);
  const [allergiesText, setAllergiesText] = useState("");
  const [hasMeds, setHasMeds] = useState<boolean>(false);
  const [medsText, setMedsText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleGenerateBrief = () => {
    const chief = complaintText.trim() || selectedSymptoms.join(", ") || "General medical consultation";
    
    // Determine urgency level
    let urgency: "routine" | "moderate" | "urgent" = "routine";
    if (painLevel >= 7 || selectedSymptoms.includes("Chest Pain") || selectedSymptoms.includes("Shortness of Breath")) {
      urgency = "urgent";
    } else if (painLevel >= 4 || selectedSymptoms.length > 2) {
      urgency = "moderate";
    }

    // Auto-generate professional clinical SOAP note
    const brief: TriageBrief = {
      appointmentId: token.appointmentId,
      patientId: token.patientId,
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : [chief],
      chiefComplaint: chief,
      duration,
      painScale: painLevel,
      allergies: hasAllergies ? allergiesText.trim() || "Reported allergies (unspecified)" : "No known drug allergies (NKDA)",
      currentMedications: hasMeds ? medsText.trim() || "Reported daily prescriptions" : "None reported",
      urgency,
      soapNote: {
        subjective: `Patient reports: ${chief}. Onset/Duration: ${duration}. Pain/Discomfort rating: ${painLevel}/10 (${
          painLevel <= 3 ? "Mild" : painLevel <= 6 ? "Moderate" : "Severe"
        }).`,
        objective: `Reported history: ${hasAllergies ? `Allergies: ${allergiesText || "Yes"}` : "NKDA"}. Ongoing medications: ${
          hasMeds ? medsText || "Yes" : "None"
        }.`,
        assessment: `Aura AI Clinical Impression: ${
          urgency === "urgent"
            ? "High-priority symptomatic presentation requiring prompt physical evaluation."
            : urgency === "moderate"
            ? "Moderate acute discomfort; candidate for targeted examination and symptom relief."
            : "Stable routine presentation consistent with reported complaints."
        }`,
        plan: `1. Focused clinical examination.\n2. Inquire further about ${chief}.\n3. Prescribe appropriate therapeutic regimen or baseline diagnostics if indicated.`,
      },
      submittedAt: new Date().toISOString(),
    };

    setLoading(true);
    setTimeout(() => {
      onSubmit(brief);
      setLoading(false);
      toast("success", "Doctor Briefed!", "Your clinical summary is now ready on your doctor's screen.");
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl transition-all dark:border-cyan-500/40 dark:bg-[#06152b]/95 dark:shadow-[0_0_40px_rgba(0,180,216,0.25)]">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-cyan-500/20">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-100 text-teal-700 dark:bg-cyan-950/80 dark:border dark:border-cyan-400/40 dark:text-cyan-300">
            <Sparkles className="h-5 w-5 animate-pulse text-cyan-600 dark:text-cyan-400" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Aura 45-Sec Health Check-In
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-100 text-teal-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                Token #{token.tokenNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Briefs {token.doctorName} before you enter the room so your visit is fast & focused.
            </p>
          </div>
        </div>

        {/* 1. Fast 1-Click Symptom Pills */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            1. What are your main symptoms today? (Tap to select)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SYMPTOMS.map((sym) => {
              const active = selectedSymptoms.includes(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => toggleSymptom(sym)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-teal-600 text-white shadow-xs dark:bg-cyan-500 dark:text-slate-950 font-bold"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#081a33] dark:text-slate-300 dark:hover:bg-[#0c264a]"
                  }`}
                >
                  {active ? `✓ ${sym}` : `+ ${sym}`}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Or describe briefly in your own words..."
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            className="mt-2 w-full h-8 sm:h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-600 focus:bg-white dark:border-[#153457] dark:bg-[#040f21] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* 2. Discomfort Level & Duration */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pain Scale */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              2. Discomfort Level (1–10)
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {[
                { label: "Mild", range: 2, icon: "😊" },
                { label: "Moderate", range: 5, icon: "😐" },
                { label: "Severe", range: 8, icon: "😣" },
              ].map((lvl) => (
                <button
                  key={lvl.label}
                  type="button"
                  onClick={() => setPainLevel(lvl.range)}
                  className={`py-1.5 px-1 rounded-xl border text-xs transition-all ${
                    (lvl.label === "Mild" && painLevel <= 3) ||
                    (lvl.label === "Moderate" && painLevel >= 4 && painLevel <= 6) ||
                    (lvl.label === "Severe" && painLevel >= 7)
                      ? "border-teal-600 bg-teal-50 text-teal-800 font-bold dark:border-cyan-400 dark:bg-cyan-950/60 dark:text-cyan-300 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-[#081a33] dark:text-slate-400"
                  }`}
                >
                  <span className="text-sm block">{lvl.icon}</span>
                  <span>{lvl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              3. Since when?
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-center">
              {["Today", "2-3 Days", "1 Week+", "Long-term"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`py-1.5 px-1 rounded-xl border text-xs transition-all ${
                    duration === d
                      ? "border-teal-600 bg-teal-50 text-teal-800 font-bold dark:border-cyan-400 dark:bg-cyan-950/60 dark:text-cyan-300 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-[#081a33] dark:text-slate-400"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Fast Allergies & Daily Meds Toggles */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-cyan-500/20 space-y-2">
          {/* Allergies */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Any drug/medicine allergies?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHasAllergies(false)}
                className={`py-1 px-3 rounded-lg text-xs font-semibold ${
                  !hasAllergies
                    ? "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white"
                    : "text-slate-400"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setHasAllergies(true)}
                className={`py-1 px-3 rounded-lg text-xs font-semibold ${
                  hasAllergies
                    ? "bg-rose-500 text-white"
                    : "text-slate-400"
                }`}
              >
                Yes
              </button>
            </div>
          </div>
          {hasAllergies && (
            <input
              type="text"
              placeholder="e.g. Penicillin, Aspirin, Sulfa drugs"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              className="w-full h-8 rounded-xl border border-rose-300 bg-rose-50/50 px-3 text-xs text-rose-900 placeholder:text-rose-400 outline-none dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-200"
            />
          )}

          {/* Daily Prescriptions */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Taking daily prescription meds?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHasMeds(false)}
                className={`py-1 px-3 rounded-lg text-xs font-semibold ${
                  !hasMeds
                    ? "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white"
                    : "text-slate-400"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setHasMeds(true)}
                className={`py-1 px-3 rounded-lg text-xs font-semibold ${
                  hasMeds
                    ? "bg-teal-600 text-white dark:bg-cyan-500 dark:text-slate-950"
                    : "text-slate-400"
                }`}
              >
                Yes
              </button>
            </div>
          </div>
          {hasMeds && (
            <input
              type="text"
              placeholder="e.g. Blood pressure medicine, Insulin, Thyroid"
              value={medsText}
              onChange={(e) => setMedsText(e.target.value)}
              className="w-full h-8 rounded-xl border border-cyan-300 bg-cyan-50/50 px-3 text-xs text-teal-900 placeholder:text-teal-400 outline-none dark:border-cyan-500/40 dark:bg-cyan-950/30 dark:text-cyan-200"
            />
          )}
        </div>

        {/* CTA SUBMIT BUTTON */}
        <div className="mt-5 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerateBrief}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-700 text-white text-xs sm:text-sm font-bold shadow-md hover:brightness-105 active:scale-[0.99] transition disabled:opacity-70 dark:from-[#0072ff] dark:to-[#00b4d8] dark:shadow-[0_0_20px_rgba(0,180,216,0.4)]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Compiling Clinical Brief...
              </span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Brief Doctor with AI Now (Done in 45s)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
