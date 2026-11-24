"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Pill,
  Printer,
  Radio,
  Sparkles,
  Stethoscope,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLiveQueue } from "@/hooks/useLiveQueue";
import { useApp } from "@/hooks/useApp";
import { fmtTime } from "@/lib/utilities";
import { announcePatientCall, playHospitalChime, sendBrowserNotification } from "@/lib/audioAlert";
import PatientTriageModal from "@/components/queue/PatientTriageModal";
import PrescriptionViewModal from "@/components/prescriptions/PrescriptionViewModal";
import RescheduleModal from "@/components/appointments/RescheduleModal";
import { Appointment, Prescription, PrescriptionItem } from "@/types";

export default function PatientLiveQueueCard() {
  const { data, saveTriageBrief } = useApp();
  const { tokens, myToken, currentCallingToken, submitTriageBrief } = useLiveQueue();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [notifGranted, setNotifGranted] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [reschedulingPassedAppt, setReschedulingPassedAppt] = useState<Appointment | null>(null);

  const visitPrescription = useMemo(() => {
    if (!myToken) return null;
    return (data.prescriptions || []).find(
      (p) =>
        (myToken.appointmentId && p.appointmentId === myToken.appointmentId) ||
        (p.patientId === myToken.patientId && p.doctorId === myToken.doctorId && p.date === myToken.date)
    );
  }, [data.prescriptions, myToken]);

  const matchingAppt = useMemo(() => {
    if (!myToken) return null;
    return (data.appointments || []).find(
      (a) =>
        a.id === myToken.appointmentId ||
        (a.patientId === myToken.patientId && a.doctorId === myToken.doctorId && a.date === myToken.date)
    );
  }, [data.appointments, myToken]);

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

  // Immediate On-Device Audio & Notification Announcement when patient's token is called or recalled
  const lastCallingStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (myToken && myToken.status === "calling" && lastCallingStatusRef.current !== "calling") {
      lastCallingStatusRef.current = "calling";
      if (audioEnabled) {
        announcePatientCall(myToken.tokenNumber, myToken.patientName, myToken.room);
      }
      sendBrowserNotification("🔔 MEDIVANCE: Your Token is Called!", {
        body: `Token #${myToken.tokenNumber} — ${myToken.doctorName} is ready for you in ${myToken.room}. Please enter now!`,
      });
    } else if (myToken && myToken.status !== "calling") {
      lastCallingStatusRef.current = myToken.status;
    }
  }, [myToken?.status, myToken?.tokenNumber, myToken?.patientName, myToken?.room, audioEnabled]);

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

  // If consultation is completed, render a clean, realistic Concluded Visit Summary (hide pre-visit checkin & waiting queue)
  if (isCompleted) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-white/95 p-5 sm:p-6 shadow-sm backdrop-blur-xl transition-all dark:border-emerald-500/30 dark:bg-[#041a24]/90 dark:shadow-[0_0_28px_rgba(16,185,129,0.15)]">
        {/* Background Ambience Sheen */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-emerald-500/20">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:border dark:border-emerald-400/40 dark:text-emerald-300">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white">
                  Today&apos;s Consultation Concluded
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                  COMPLETED
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your visit with {myToken.doctorName} has concluded. Your digital prescription and clinical notes are archived in your portal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <Link
              href="/patient/appointments"
              className="py-2 px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
            >
              View Prescriptions &amp; Records →
            </Link>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-emerald-500/20 dark:bg-[#03151f]/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed Token
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                #{myToken.tokenNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                Fulfilled
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Session Time: {myToken.time}</span>
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-emerald-500/20 dark:bg-[#03151f]/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Attending Physician
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{myToken.doctorName}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {myToken.specialization}
            </p>
            <p className="mt-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{myToken.room}</span>
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-emerald-500/20 dark:bg-[#03151f]/80 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Follow-Up / Next Visit
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Need to book another visit or follow up with a specialist?
              </p>
            </div>
            <Link
              href="/patient/book"
              className="mt-2.5 block text-center py-1.5 px-3 rounded-xl bg-primary text-white text-xs font-semibold hover:brightness-105 transition shadow-xs"
            >
              Book New Appointment +
            </Link>
          </div>
        </div>

        {/* DOCTOR ISSUED PRESCRIPTION CARD */}
        {visitPrescription && (
          <div className="mt-4 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent p-4 sm:p-5 dark:border-emerald-500/30 dark:bg-[#032025]/60 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:border dark:border-emerald-400/40 dark:text-emerald-300">
                  <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Digital Prescription Issued
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                      {visitPrescription.rxNumber || "VERIFIED RX"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prescribed by {visitPrescription.doctorName} • Diagnosis: <strong className="text-emerald-700 dark:text-emerald-300">{visitPrescription.diagnosis || "Consultation Assessment"}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRx(visitPrescription)}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm shrink-0"
              >
                <Printer className="h-3.5 w-3.5" /> View Official Slip &amp; QR
              </button>
            </div>

            {/* Prescribed Medications Preview */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {visitPrescription.medications.map((m: PrescriptionItem, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200/80 bg-white/90 p-2.5 text-xs dark:border-emerald-500/20 dark:bg-[#03151f]/80">
                  <p className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{m.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-semibold">{m.dosage}</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-[11px]">
                    {m.frequency} • {m.duration}
                  </p>
                  {m.instructions && (
                    <p className="text-teal-700 dark:text-cyan-400 text-[10.5px] mt-0.5 italic">
                      Tip: {m.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {visitPrescription.instructions && (
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-emerald-500/20">
                <strong className="text-slate-800 dark:text-slate-200">Doctor&apos;s Advice:</strong> {visitPrescription.instructions}
              </p>
            )}
          </div>
        )}

        {/* View Prescription Modal */}
        {selectedRx && (
          <PrescriptionViewModal
            prescription={selectedRx}
            patientName={myToken.patientName}
            open={Boolean(selectedRx)}
            onClose={() => setSelectedRx(null)}
          />
        )}
      </div>
    );
  }

  // If consultation window elapsed while clinic was closed / doctor unavailable
  if (myToken.status === "passed") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-white/95 p-5 sm:p-6 shadow-sm backdrop-blur-xl transition-all dark:border-amber-500/30 dark:bg-[#1f1707]/90 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:border dark:border-amber-400/40 dark:text-amber-300">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white">
                  Appointment Time Elapsed
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                  SLOT PASSED
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Your scheduled consultation slot ({fmtTime(myToken.time)}) with {myToken.doctorName} has elapsed. Please choose an upcoming date to reschedule.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {matchingAppt ? (
              <button
                type="button"
                onClick={() => setReschedulingPassedAppt(matchingAppt)}
                className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Reschedule Passed Slot (Fee Waived)</span>
              </button>
            ) : (
              <Link
                href="/patient/appointments"
                className="py-2 px-3.5 rounded-xl bg-primary text-primary-fg text-xs font-semibold hover:brightness-105 transition shadow-sm"
              >
                Reschedule Visit →
              </Link>
            )}
          </div>
        </div>

        {/* Reschedule Modal for Passed Slot */}
        {reschedulingPassedAppt && (
          <RescheduleModal
            a={reschedulingPassedAppt}
            open={Boolean(reschedulingPassedAppt)}
            onClose={() => setReschedulingPassedAppt(null)}
          />
        )}
      </div>
    );
  }

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
            Email &amp; Voice Alert Active
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
            onClick={() => {
              announcePatientCall(myToken.tokenNumber, myToken.patientName, myToken.room);
            }}
            className="shrink-0 py-1.5 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700 flex items-center gap-1 active:scale-[0.98]"
            title="Replay doctor announcement audio"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Hear Announcement 🔔</span>
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

      {/* REAL-TIME PRESCRIPTION READY BANNER */}
      {visitPrescription && (
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 border border-emerald-500/30 dark:bg-emerald-950/40 dark:border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 shrink-0">
              <Pill className="h-4 w-4" />
            </span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Official Prescription Issued by Dr. {myToken.doctorName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {visitPrescription.medications.length} medication{visitPrescription.medications.length > 1 ? "s" : ""} prescribed • {visitPrescription.rxNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedRx(visitPrescription)}
            className="py-1.5 px-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>View Digital Rx</span>
          </button>
        </div>
      )}

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
          onSubmit={(brief) => {
            submitTriageBrief(myToken.id, brief);
            if (myToken.appointmentId) {
              saveTriageBrief(myToken.appointmentId, brief);
            }
          }}
        />
      )}

      {/* Prescription View Modal */}
      {selectedRx && (
        <PrescriptionViewModal
          prescription={selectedRx}
          patientName={myToken.patientName}
          open={Boolean(selectedRx)}
          onClose={() => setSelectedRx(null)}
        />
      )}
    </div>
  );
}
