"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Check,
  CheckCircle2,
  Compass,
  Footprints,
  MapPin,
  Navigation,
  QrCode,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLiveQueue } from "@/hooks/useLiveQueue";
import { toast } from "@/components/notifications/alerts";
import QRCodeSVG from "@/components/ui/QRCodeSVG";

export default function HospitalArrivalCheckIn() {
  const { myToken, checkInAtHospital } = useLiveQueue();
  const [showQrModal, setShowQrModal] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!myToken || myToken.status === "completed") return null;

  const isCheckedIn = myToken.arrivedStatus === "in_lobby";

  const handleCheckIn = () => {
    checkInAtHospital(myToken.id);
    toast(
      "success",
      "Reception Bypassed & Check-In Complete!",
      `${myToken.doctorName}'s screen has been notified that you are seated outside ${myToken.room}.`
    );
  };

  const handleQrTap = () => {
    setScannedFeedback(true);
    if (!isCheckedIn) {
      checkInAtHospital(myToken.id);
    }
    toast(
      "success",
      "QR Turnstile Scanned!",
      `Access Granted for ${myToken.patientName} (Token #${myToken.tokenNumber}) to ${myToken.room}.`
    );
    setTimeout(() => setScannedFeedback(false), 4000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-900/20 via-cyan-900/15 to-transparent p-4 sm:p-5 shadow-sm backdrop-blur-xl dark:border-cyan-400/30 dark:bg-[#051833]/90">
      {/* Background Ambience Sheen */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl dark:bg-cyan-500/15" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Geofence & Check-In Status */}
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800 dark:bg-cyan-950/80 dark:border dark:border-cyan-400/40 dark:text-cyan-300">
            {isCheckedIn ? (
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            ) : (
              <Navigation className="h-5 w-5 text-teal-600 dark:text-cyan-400 animate-pulse" />
            )}
          </span>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>1-Click Hospital Fast-Track Check-In</span>
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 flex items-center gap-1">
                <Radio className="h-2.5 w-2.5 text-emerald-500 animate-ping" />
                <span>GPS GEOFENCE ACTIVE</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {isCheckedIn ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  &check; You are checked in &amp; seated in waiting lobby. Front-desk line bypassed!
                </span>
              ) : (
                <span>
                  Within 50m of MEDIVANCE Hospital. Tap below to bypass reception queue and announce arrival.
                </span>
              )}
            </p>

            {/* Indoor Walking Directions Snippet */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                <Footprints className="h-3.5 w-3.5 text-cyan-500" />
                <span>Indoor Route:</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#071d38] border border-slate-200 dark:border-cyan-500/20">
                Main Entrance
              </span>
              <span>&rarr;</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#071d38] border border-slate-200 dark:border-cyan-500/20">
                Elevator B (Level 1)
              </span>
              <span>&rarr;</span>
              <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-cyan-900/40 text-teal-900 dark:text-cyan-200 font-bold border border-teal-200 dark:border-cyan-500/30">
                {myToken.room}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action: 1-Click Check-In Button or Pass */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
          {!isCheckedIn ? (
            <button
              type="button"
              onClick={handleCheckIn}
              className="flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-primary text-primary-fg text-xs font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>I Have Arrived (Bypass Reception)</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-ok/15 border border-ok/40 text-ok text-xs font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
              <span>Doctor Knows You Are In Lobby</span>
            </span>
          )}

          {/* Gate Pass QR button */}
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full border border-cyan-500/40 bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-200 text-xs font-semibold shadow-xs transition active:scale-[0.98]"
            title="Show Digital Gate Pass QR"
          >
            <QrCode className="h-3.5 w-3.5 text-cyan-400" />
            <span>Digital Gate Pass</span>
          </button>
        </div>
      </div>

      {/* MODAL: Digital OPD Gate Pass (Portaled directly to document.body to avoid parent card clipping) */}
      {mounted && showQrModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto animate-pop rounded-3xl border border-cyan-400/40 bg-[#071a33] p-6 shadow-2xl text-center flex flex-col justify-between my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="text-left">
                <h4 className="font-bold text-base text-white">
                  MEDIVANCE Digital Gate Pass
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scan at OPD lobby turnstile or tap to verify
                </p>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Clickable QR Code with Interactive Scanner */}
            <div className="my-4">
              <button
                type="button"
                onClick={handleQrTap}
                className="group relative flex justify-center p-4 rounded-2xl bg-white border-2 border-dashed border-cyan-400 hover:border-cyan-300 mx-auto shadow-md transition hover:scale-[1.02] cursor-pointer"
                title="Tap to simulate turnstile gate scan"
              >
                <QRCodeSVG
                  value={`https://medivance.pk/verify/pass/${myToken.id}?token=${myToken.tokenNumber}&doctor=${encodeURIComponent(myToken.doctorName)}`}
                  size={156}
                />
                <span className="absolute inset-x-3 bottom-2 rounded-lg bg-teal-900/90 text-white text-[10.5px] font-semibold py-0.5 opacity-0 group-hover:opacity-100 transition backdrop-blur-xs">
                  Tap to Scan Turnstile ⚡
                </span>
              </button>

              <p className="mt-2 text-[11px] text-cyan-300/80 font-medium">
                Tap QR code above to simulate automated gate scan
              </p>

              {/* Scanned Feedback Banner */}
              {scannedFeedback && (
                <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-xs font-bold text-emerald-300 animate-pop">
                  ✓ Turnstile Gate 2 Opened! Access to Elevator B Granted.
                </div>
              )}
            </div>

            {/* Pass Metadata */}
            <div className="p-3.5 rounded-2xl bg-[#041024] text-xs text-left space-y-2 border border-cyan-500/20">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Token Number:</span>
                <strong className="text-cyan-400 font-serif text-base">#{myToken.tokenNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-semibold text-slate-200">{myToken.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Doctor:</span>
                <span className="font-semibold text-slate-200">{myToken.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Clinic Room:</span>
                <span className="font-semibold text-cyan-300">{myToken.room}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-400">Lobby Status:</span>
                <span className="font-bold text-emerald-400 uppercase text-[11px]">
                  {isCheckedIn ? "🟢 Seated in Lobby" : "⚪ En Route"}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-2">
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md transition"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
