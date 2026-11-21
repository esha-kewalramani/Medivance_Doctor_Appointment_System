"use client";
import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLiveQueue } from "@/hooks/useLiveQueue";
import { useApp } from "@/hooks/useApp";
import { todayISO } from "@/lib/utilities";
import { Prescription, QueueToken } from "@/types";
import DoctorPrescriptionModal from "@/components/prescriptions/DoctorPrescriptionModal";
import PrescriptionViewModal from "@/components/prescriptions/PrescriptionViewModal";
import { toast } from "@/components/notifications/alerts";

export default function DoctorQueueController() {
  const { session, setStatus } = useApp();
  const {
    tokens,
    callNextPatient,
    startConsultation,
    completeConsultation,
    undoComplete,
  } = useLiveQueue();

  const today = todayISO();
  // Tokens assigned to this doctor for today
  const doctorTokens = tokens.filter(
    (t) => t.date === today && (!session?.userId || t.doctorId === session.userId)
  );

  const callingToken = doctorTokens.find((t) => t.status === "calling");
  const inConsultToken = doctorTokens.find((t) => t.status === "in_consultation");
  const activeToken = callingToken || inConsultToken;
  const waitingTokens = doctorTokens.filter((t) => t.status === "waiting");
  const completedTokens = doctorTokens.filter((t) => t.status === "completed");
  const nextWaitingPatient = waitingTokens[0] || null;

  const [busy, setBusy] = useState(false);
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [viewRxModalOpen, setViewRxModalOpen] = useState(false);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);

  // ---------- AUTO-PILOT 30-MINUTE OPD QUEUE PROGRESSION ENGINE ----------
  const [autoPilot, setAutoPilot] = useState(true);
  const [consultDuration, setConsultDuration] = useState<number>(1800); // 1800s = 30 minutes (or 30s for demo)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800);
  const [recentCompletedTokenId, setRecentCompletedTokenId] = useState<string | null>(null);
  const [showEarlyCompleteModal, setShowEarlyCompleteModal] = useState<boolean>(false);

  // Sync remaining seconds when consultation starts
  useEffect(() => {
    if (inConsultToken) {
      setSecondsRemaining((prev) => (prev <= 0 ? consultDuration : prev));
    } else {
      setSecondsRemaining(consultDuration);
    }
  }, [inConsultToken?.id, consultDuration]);

  // Main Auto-Pilot Ticker: 30-Minute Countdown & Automatic Advancement
  useEffect(() => {
    if (!autoPilot) return;

    const interval = setInterval(() => {
      // Case 1: In consultation -> count down every second
      if (inConsultToken) {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // 30 MINUTES EXPIRED! Auto-complete and announce next
            toast("info", "Consultation Complete (30 Min Allotment)", "Auto-progressing to next patient in line.");
            completeConsultation(inConsultToken.id, false);
            if (inConsultToken.appointmentId) {
              setStatus(inConsultToken.appointmentId, "completed");
            }
            // Immediately call the next patient
            setTimeout(() => {
              callNextPatient(session?.userId);
            }, 600);
            return consultDuration;
          }
          return prev - 1;
        });
      }
      // Case 2: Patient is being called -> auto-start consultation after 6s grace window
      else if (callingToken) {
        startConsultation(callingToken.id);
      }
      // Case 3: Idle and patients waiting -> automatically summon first patient
      else if (!activeToken && waitingTokens.length > 0) {
        callNextPatient(session?.userId);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    autoPilot,
    inConsultToken,
    callingToken,
    activeToken,
    waitingTokens.length,
    consultDuration,
    completeConsultation,
    callNextPatient,
    startConsultation,
    session?.userId,
  ]);

  const handleCallNext = () => {
    setBusy(true);
    callNextPatient(session?.userId);
    setTimeout(() => setBusy(false), 600);
  };

  // Safe Completion Trigger: Protects against accidental clicks if session is still ongoing
  const handleRequestComplete = () => {
    if (inConsultToken && secondsRemaining > 120 && consultDuration >= 300) {
      // More than 2 minutes left -> prompt for confirmation to prevent accidental clicks
      setShowEarlyCompleteModal(true);
    } else if (activeToken) {
      executeComplete(false);
    }
  };

  const executeComplete = (isEarly: boolean) => {
    if (!activeToken) return;
    const completedId = activeToken.id;
    setRecentCompletedTokenId(completedId);
    setShowEarlyCompleteModal(false);

    completeConsultation(completedId, isEarly);
    if (activeToken.appointmentId) {
      setStatus(activeToken.appointmentId, "completed");
    }

    if (isEarly && nextWaitingPatient) {
      toast(
        "success",
        "Next Patient Alerted (Fast-Track)",
        `Token #${nextWaitingPatient.tokenNumber} (${nextWaitingPatient.patientName}) notified via SMS/Email to proceed to ${nextWaitingPatient.room}.`
      );
    }

    // Auto-clear undo window after 12 seconds
    setTimeout(() => {
      setRecentCompletedTokenId((prev) => (prev === completedId ? null : prev));
    }, 12000);
  };

  const handleUndo = () => {
    if (recentCompletedTokenId) {
      const restored = doctorTokens.find((t) => t.id === recentCompletedTokenId);
      undoComplete(recentCompletedTokenId);
      if (restored?.appointmentId) {
        setStatus(restored.appointmentId, "approved");
      }
      setRecentCompletedTokenId(null);
      toast("info", "Session Restored", "Patient consultation reopened.");
    }
  };

  // Format seconds into MM:SS
  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPct = Math.min(100, Math.max(0, ((consultDuration - secondsRemaining) / consultDuration) * 100));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-cyan-500/30 dark:bg-[#06152b]/90 dark:shadow-[0_0_30px_rgba(0,180,216,0.18)]">
      {/* Background Ambience Sheen */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/15" />

      {/* TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-teal-700 dark:bg-cyan-950/80 dark:border dark:border-cyan-400/40 dark:text-cyan-300">
            <Radio className="h-5 w-5 animate-pulse text-cyan-600 dark:text-cyan-400" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-white">
                Live Queue & OPD Controller
              </h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hands-free 30-min auto-pacing with synthetic voice announcements & patient SMS alerts
            </p>
          </div>
        </div>

        {/* CONTROLS: Auto-Pilot Switch & Manual Call Next */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pacing Speed Selector */}
          <select
            value={consultDuration}
            onChange={(e) => {
              const val = Number(e.target.value);
              setConsultDuration(val);
              setSecondsRemaining(val);
            }}
            className="text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#071d38] border border-slate-200 dark:border-cyan-500/30 px-2.5 py-1.5 text-slate-700 dark:text-cyan-300 outline-none"
            title="Consultation Duration Pacing"
          >
            <option value={1800}>Standard 30 Min Pacing</option>
            <option value={30}>Fast 30 Sec (Demo Mode)</option>
          </select>

          {/* Auto-Pilot Toggle */}
          <button
            type="button"
            onClick={() => setAutoPilot(!autoPilot)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
              autoPilot
                ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-700 dark:text-emerald-300"
                : "bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {autoPilot ? (
              <>
                <Zap className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span>Auto-Pilot: ON</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 text-slate-400" />
                <span>Auto-Pilot: PAUSED</span>
              </>
            )}
          </button>

          {/* Primary Call Next Button */}
          <button
            type="button"
            onClick={handleCallNext}
            disabled={busy || waitingTokens.length === 0}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50 dark:from-[#0072ff] dark:to-[#00b4d8]"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Call Next ({waitingTokens.length})</span>
          </button>
        </div>
      </div>

      {/* ACCIDENTAL CLICK UNDO BANNER */}
      {recentCompletedTokenId && (
        <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs animate-pop">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Marked session as complete. Click undo if clicked mistakenly:</span>
          </div>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 font-bold text-amber-900 dark:text-amber-200 underline hover:no-underline"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Undo / Reopen Consultation
          </button>
        </div>
      )}

      {/* CURRENT PATIENT IN CONSULTATION / CALLED BANNER */}
      {activeToken ? (
        <div
          className={`mt-4 p-4 rounded-2xl border transition-all ${
            activeToken.status === "calling"
              ? "border-emerald-400 bg-emerald-50/90 dark:border-emerald-400/60 dark:bg-emerald-950/40"
              : "border-cyan-300 bg-cyan-50/80 dark:border-cyan-500/40 dark:bg-cyan-950/40"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white border border-slate-200 text-teal-700 font-serif text-xl font-bold dark:border-cyan-400/40 dark:bg-[#071d38] dark:text-[#00c8ff]">
                #{activeToken.tokenNumber}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase ${
                      activeToken.status === "calling"
                        ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-300 animate-pulse"
                        : "bg-blue-200 text-blue-900 dark:bg-blue-500/30 dark:text-blue-300"
                    }`}
                  >
                    {activeToken.status === "calling" ? "📢 Calling Patient (Audible Voice)" : "👨‍⚕️ In Consultation"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Scheduled: {activeToken.time}
                  </span>
                  {activeToken.arrivedStatus === "in_lobby" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                      🟢 Seated in Lobby
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      ⚪ En Route
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                  {activeToken.patientName}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Assigned Location: <strong>{activeToken.room}</strong>
                </p>
              </div>
            </div>

            {/* LIVE 30-MINUTE AUTO-PACING TIMER */}
            {activeToken.status === "in_consultation" && (
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
                  <span className="font-mono text-lg font-bold text-slate-900 dark:text-cyan-300">
                    {formatTimer(secondsRemaining)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    / {Math.round(consultDuration / 60)}m
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-36 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-1000 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">Auto-moves when time ends</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {activeToken.status === "calling" ? (
                <button
                  type="button"
                  onClick={() => startConsultation(activeToken.id)}
                  className="py-1.5 px-3 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition dark:bg-cyan-500 dark:hover:bg-cyan-400"
                >
                  <Play className="h-3.5 w-3.5 inline mr-1" />
                  Begin Consultation
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setRxModalOpen(true)}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 text-white text-xs font-semibold hover:brightness-105 transition dark:from-cyan-500 dark:to-blue-600 dark:text-slate-950 shadow-xs flex items-center gap-1"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Write Prescription
                  </button>

                  {/* Extend Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSecondsRemaining((prev) => prev + 300);
                      toast("info", "Extended +5 Mins", "Added 5 minutes to current consultation.");
                    }}
                    className="py-1.5 px-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 dark:border-cyan-500/30 dark:bg-[#071d38] dark:text-cyan-300"
                    title="Add 5 minutes to current session"
                  >
                    +5 min
                  </button>

                  {/* Mark Complete (Safe) */}
                  <button
                    type="button"
                    onClick={handleRequestComplete}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark Complete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* UPCOMING PATIENT READY NOTIFICATION STATUS */}
          {nextWaitingPatient && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-white/70 dark:bg-[#040f21]/60 border border-slate-200/60 dark:border-cyan-500/20 flex flex-wrap items-center justify-between text-xs gap-2">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Send className="h-3.5 w-3.5 text-cyan-500" />
                <span>Next in line: <strong>Token #{nextWaitingPatient.tokenNumber}</strong> ({nextWaitingPatient.patientName})</span>
              </span>
              <span className="text-[11px] text-teal-700 dark:text-cyan-400 font-semibold">
                Will receive instant SMS & Announcement if session finishes early
              </span>
            </div>
          )}

          {/* AURA AI PRE-CONSULTATION SOAP NOTE */}
          {activeToken.triageBrief && (
            <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-cyan-500/20 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-cyan-300 mb-2">
                <Sparkles className="h-4 w-4 text-cyan-500" />
                <span>Aura AI Pre-Consultation SOAP Note:</span>
                <span
                  className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    activeToken.triageBrief.urgency === "urgent"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse"
                      : activeToken.triageBrief.urgency === "moderate"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  }`}
                >
                  Triage: {activeToken.triageBrief.urgency}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed">
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#040f21]/70 border border-slate-200/70 dark:border-cyan-500/20">
                  <strong className="text-teal-700 dark:text-cyan-400">S (Subjective):</strong>{" "}
                  {activeToken.triageBrief.soapNote.subjective}
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#040f21]/70 border border-slate-200/70 dark:border-cyan-500/20">
                  <strong className="text-teal-700 dark:text-cyan-400">O (Objective):</strong>{" "}
                  {activeToken.triageBrief.soapNote.objective}
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#040f21]/70 border border-slate-200/70 dark:border-cyan-500/20">
                  <strong className="text-teal-700 dark:text-cyan-400">A (Assessment):</strong>{" "}
                  {activeToken.triageBrief.soapNote.assessment}
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#040f21]/70 border border-slate-200/70 dark:border-cyan-500/20">
                  <strong className="text-teal-700 dark:text-cyan-400">P (Plan):</strong>{" "}
                  {activeToken.triageBrief.soapNote.plan}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-[#040f21]/50 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            {waitingTokens.length > 0
              ? `Auto-Pilot is ready: ${waitingTokens.length} patients waiting in queue.`
              : "No patients currently in queue for today."}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Queue automatically starts on schedule and advances every 30 minutes without manual intervention.
          </p>
        </div>
      )}

      {/* TODAY'S QUEUE SUMMARY TABLE / LIST */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Today&apos;s OPD Roster ({doctorTokens.length} Total Patients)
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {completedTokens.length} Completed &bull; {waitingTokens.length} In Line
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-cyan-500/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-[#071d38]/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-cyan-500/20">
              <tr>
                <th className="py-2.5 px-3">Token</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">Scheduled Time</th>
                <th className="py-2.5 px-3">Lobby Arrival</th>
                <th className="py-2.5 px-3">Triage</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-cyan-500/10 text-slate-700 dark:text-slate-200">
              {doctorTokens.map((t) => (
                <tr
                  key={t.id}
                  className={`transition hover:bg-slate-50 dark:hover:bg-cyan-950/20 ${
                    t.status === "in_consultation"
                      ? "bg-cyan-50/50 dark:bg-cyan-950/30 font-medium"
                      : t.status === "calling"
                      ? "bg-emerald-50/50 dark:bg-emerald-950/30"
                      : ""
                  }`}
                >
                  <td className="py-2 px-3 font-serif font-bold text-teal-800 dark:text-cyan-400">
                    #{t.tokenNumber}
                  </td>
                  <td className="py-2 px-3 font-semibold">{t.patientName}</td>
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{t.time}</td>
                  <td className="py-2 px-3">
                    {t.arrivedStatus === "in_lobby" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                        🟢 In Lobby
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        ⚪ En Route
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {t.triageBrief ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-100 text-teal-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                        SOAP Ready
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Pre-Checkin Pending</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === "completed"
                          ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          : t.status === "in_consultation"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                          : t.status === "calling"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 animate-pulse"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    {t.status === "waiting" && (
                      <button
                        onClick={() => callNextPatient(t.doctorId)}
                        className="text-[11px] font-semibold text-teal-700 dark:text-cyan-400 hover:underline"
                      >
                        Call Now
                      </button>
                    )}
                    {t.status === "completed" && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        &check; Finished
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EARLY COMPLETION WARNING MODAL */}
      {showEarlyCompleteModal && activeToken && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md animate-pop rounded-2xl border border-amber-300 bg-white p-5 shadow-2xl dark:border-amber-500/40 dark:bg-[#071a33]">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Early Consultation Completion
              </h4>
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You still have <strong>{formatTimer(secondsRemaining)}</strong> remaining on this session with{" "}
              <strong>{activeToken.patientName}</strong>.
            </p>

            <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
              {nextWaitingPatient ? (
                <span>
                  ⚡ Marking complete now will automatically dispatch an immediate <strong>Fast-Track SMS & Email</strong> to{" "}
                  <strong>{nextWaitingPatient.patientName} (Token #{nextWaitingPatient.tokenNumber})</strong> telling them you are ready early!
                </span>
              ) : (
                <span>Are you sure you want to finish this patient&apos;s visit early?</span>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowEarlyCompleteModal(false)}
                className="py-2 px-3.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                No, Keep Consulting
              </button>
              <button
                type="button"
                onClick={() => executeComplete(true)}
                className="py-2 px-4 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shadow-sm"
              >
                Yes, Finish Early & Alert Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Generator Modal */}
      {rxModalOpen && activeToken && (
        <DoctorPrescriptionModal
          token={activeToken}
          patientId={activeToken.patientId}
          patientName={activeToken.patientName}
          doctorId={activeToken.doctorId}
          doctorName={activeToken.doctorName}
          open={rxModalOpen}
          onClose={() => setRxModalOpen(false)}
          onSuccess={(rx: Prescription) => {
            setActivePrescription(rx);
            setRxModalOpen(false);
            setViewRxModalOpen(true);
          }}
        />
      )}

      {/* View & Print Prescription Modal */}
      {viewRxModalOpen && activePrescription && (
        <PrescriptionViewModal
          prescription={activePrescription}
          patientName={activeToken?.patientName}
          open={viewRxModalOpen}
          onClose={() => setViewRxModalOpen(false)}
        />
      )}
    </div>
  );
}
