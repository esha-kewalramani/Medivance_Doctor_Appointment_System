"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  CheckCircle2,
  Clock,
  MapPin,
  Radio,
  Sparkles,
  Stethoscope,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLiveQueue } from "@/hooks/useLiveQueue";
import { playHospitalChime, sendBrowserNotification } from "@/lib/audioAlert";
import PatientTriageModal from "@/components/queue/PatientTriageModal";

export default function PatientLiveQueueCard() {
  const { tokens, myToken, currentCallingToken, submitTriageBrief } = useLiveQueue();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [notifGranted, setNotifGranted] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  const enableNotifications = async () => {
    const granted = await sendBrowserNotification("🔔 MEDIVANCE Live Queue Alerts Enabled", {
      body: "You will receive an instant notification when your doctor calls your token number.",
    });
    setNotifGranted(granted);
    playHospitalChime();
  };

  // If patient has no personal token today, display general hospital queue pulse
  if (!myToken) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-xl transition-all dark:border-cyan-500/25 dark:bg-[#06152b]/85 dark:shadow-[0_0_24px_rgba(0,180,216,0.12)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-100/70 border border-cyan-300 text-teal-700 dark:bg-cyan-950/70 dark:border-cyan-400/30 dark:text-cyan-400">
              <Radio className="h-5 w-5 animate-pulse text-cyan-600 dark:text-cyan-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                  <Activity className="h-3 w-3" /> Live OPD Tracker
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400">Zero-Waiting-Room</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white mt-1">
                Hospital OPD Queue is Active
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                When you book an appointment, your live token number and wait-time progress will appear here in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <Link
              href="/patient/book"
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 text-white text-xs font-semibold shadow-xs hover:brightness-105 transition dark:from-cyan-500 dark:to-blue-600"
            >
              Book New Appointment →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate queue progress
  const isCalling = myToken.status === "calling";
  const isInConsultation = myToken.status === "in_consultation";
  const isCompleted = myToken.status === "completed";

  // How many patients are ahead of current patient
  const aheadCount = tokens.filter(
    (t) =>
      t.date === myToken.date &&
      t.doctorId === myToken.doctorId &&
      t.tokenNumber < myToken.tokenNumber &&
      ["waiting", "calling"].includes(t.status)
  ).length;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
        isCalling
          ? "border-2 border-emerald-500 bg-emerald-50/90 shadow-[0_0_30px_rgba(16,185,129,0.3)] dark:border-emerald-400 dark:bg-[#031d1a]/95 dark:shadow-[0_0_35px_rgba(16,185,129,0.4)] animate-pulse"
          : "border border-slate-200/90 bg-white/95 shadow-sm dark:border-cyan-500/30 dark:bg-[#06152b]/90 dark:shadow-[0_0_30px_rgba(0,180,216,0.18)]"
      }`}
    >
      {/* Background Ambience Sheen */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/15" />

      {/* TOP HEADER ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-teal-700 dark:bg-cyan-950/80 dark:border dark:border-cyan-400/40 dark:text-cyan-300">
            <Radio className="h-5 w-5 animate-pulse text-cyan-600 dark:text-cyan-400" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white">
                Live Queue & Token Tracker
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Real-time synchronization active across all hospital monitors
            </p>
          </div>
        </div>

        {/* Audio & Browser Notification Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) playHospitalChime();
            }}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-[#153457] dark:bg-[#071933] dark:text-slate-200"
            title="Toggle sound chime"
          >
            {audioEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-teal-600 dark:text-cyan-400" />
                <span>Chime On</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                <span>Muted</span>
              </>
            )}
          </button>

          {!notifGranted && (
            <button
              type="button"
              onClick={enableNotifications}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-cyan-300 bg-cyan-50 text-[11px] font-medium text-teal-800 hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-950/50 dark:text-cyan-300"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Enable Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* UP NEXT FAST-TRACK BANNER */}
      {aheadCount === 0 && myToken.status === "waiting" && (
        <div className="mt-4 p-3.5 rounded-xl border border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-400/60 dark:bg-amber-950/60 dark:text-amber-200 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-500 text-white font-bold">
              ⚡
            </span>
            <div>
              <p className="font-bold text-sm">
                YOU ARE NEXT IN LINE! (Token #{myToken.tokenNumber})
              </p>
              <p className="text-xs">
                The doctor has opened or is wrapping up the session. Please proceed to <strong>{myToken.room}</strong> now.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-2 py-1 rounded-lg bg-amber-200/80 dark:bg-amber-900/50 text-[11px] font-bold text-amber-900 dark:text-amber-200">
            SMS Dispatched
          </span>
        </div>
      )}

      {/* CALLING EMERGENCY ALERT BANNER */}
      {isCalling && (
        <div className="mt-4 p-3.5 rounded-xl border border-emerald-400 bg-emerald-100/90 text-emerald-950 dark:border-emerald-400/60 dark:bg-emerald-950/60 dark:text-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white font-bold animate-bounce">
              !
            </span>
            <div>
              <p className="font-bold text-sm">
                YOUR TOKEN IS BEING CALLED NOW!
              </p>
              <p className="text-xs">
                {myToken.doctorName} is waiting for you in <strong>{myToken.room}</strong>. Please enter the room.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={playHospitalChime}
            className="shrink-0 py-1.5 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700"
          >
            Acknowledge 🔔
          </button>
        </div>
      )}

      {/* COMPLETED CELEBRATORY BANNER */}
      {isCompleted && (
        <div className="mt-4 p-3.5 rounded-xl border border-emerald-400/60 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pop">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-slate-950 font-bold">
              ✓
            </span>
            <div>
              <p className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                CONSULTATION COMPLETED (Token #{myToken.tokenNumber})
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300/90">
                Your visit with {myToken.doctorName} is completed. Your prescription and medical notes have been saved.
              </p>
            </div>
          </div>
          <Link
            href="/patient/appointments"
            className="shrink-0 py-1.5 px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
          >
            View Completed Records →
          </Link>
        </div>
      )}

      {/* MAIN TOKEN STATS GRID */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Your Assigned Token */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-cyan-500/20 dark:bg-[#041022]/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Your Token Number
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-extrabold text-[#007791] dark:text-[#00c8ff] dark:drop-shadow-[0_0_12px_rgba(0,200,255,0.6)]">
              #{myToken.tokenNumber}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase ${
                isCalling
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : isInConsultation
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                  : isCompleted
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300"
              }`}
            >
              {myToken.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-cyan-400" />
            <span>Scheduled: {myToken.time}</span>
          </p>
        </div>

        {/* Card 2: Currently Serving & Wait Estimate */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-cyan-500/20 dark:bg-[#041022]/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Currently Calling
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`font-serif text-3xl sm:text-4xl font-bold ${isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white"}`}>
              {isCompleted ? "Finished" : (currentCallingToken ? `#${currentCallingToken.tokenNumber}` : "In Session")}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isCompleted ? "(Visit Concluded)" : (aheadCount > 0 ? `(${aheadCount} ahead of you)` : "(You are next)")}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className={`h-3.5 w-3.5 ${isCompleted ? "text-emerald-500" : "text-amber-500"}`} />
            <span>
              {isCompleted ? "Consultation completed successfully" : <>Estimated wait: <strong>{aheadCount * 12 || 5} mins</strong></>}
            </span>
          </p>
        </div>

        {/* Card 3: Doctor & Room Location */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-cyan-500/20 dark:bg-[#041022]/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Doctor & Room
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4 text-teal-600 dark:text-cyan-400" />
            <span>{myToken.doctorName}</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {myToken.specialization}
          </p>
          <p className="mt-1.5 text-xs text-teal-800 dark:text-cyan-300 font-medium flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>{myToken.room}</span>
          </p>
        </div>
      </div>

      {/* 45-SECOND PRE-CONSULTATION AI CHECK-IN STRIP */}
      <div className="mt-4">
        {myToken.triageBrief ? (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-50/80 border border-cyan-200 text-teal-900 dark:bg-cyan-950/40 dark:border-cyan-500/30 dark:text-cyan-200 text-xs">
            <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-cyan-400 shrink-0" />
            <span>
              <strong>Doctor Briefed:</strong> Aura AI compiled your preliminary clinical SOAP note for {myToken.doctorName}.
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-cyan-200/90 dark:from-[#061e38] dark:to-[#05182e] dark:border-cyan-500/30">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-100 text-teal-700 dark:bg-cyan-500/20 dark:text-cyan-400">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  Fast 45-Sec Health Check-In
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Brief your doctor in advance so your consultation is quick and focused.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTriageOpen(true)}
              className="shrink-0 py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 text-white text-xs font-semibold hover:brightness-105 transition dark:from-cyan-500 dark:to-blue-600 dark:text-slate-950 shadow-xs"
            >
              ✨ Start 45s Check-In
            </button>
          </div>
        )}
      </div>

      {/* VISUAL QUEUE PROGRESS TRACKER */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-cyan-500/20">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
          <span>Queue Progress</span>
          <span>
            {aheadCount === 0
              ? "🎯 Ready for Consultation"
              : `${aheadCount} patient${aheadCount > 1 ? "s" : ""} in front`}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-500 dark:from-[#0072ff] dark:to-[#00c8ff] transition-all duration-500"
            style={{
              width: `${Math.max(15, 100 - aheadCount * 25)}%`,
            }}
          />
        </div>
      </div>

      {/* Patient Triage Modal */}
      {triageOpen && (
        <PatientTriageModal
          token={myToken}
          open={triageOpen}
          onClose={() => setTriageOpen(false)}
          onSubmit={(brief) => submitTriageBrief(myToken.id, brief)}
        />
      )}
    </div>
  );
}
