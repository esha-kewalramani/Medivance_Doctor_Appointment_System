"use client";
import { useState, useEffect, useCallback } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, Clock, Sparkles, X, Zap } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import {
  SlotOffer,
  getActiveOfferForPatient,
  getSlotOffers,
} from "@/lib/slotOfferService";
import { fmtDate, fmtTime } from "@/lib/utilities";

export default function EarlierSlotOfferCard() {
  const { session, user, claimEarlierSlot, declineEarlierSlot } = useApp();
  const [activeOffer, setActiveOffer] = useState<SlotOffer | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshOffer = useCallback(() => {
    if (!session?.userId) {
      setActiveOffer(null);
      return;
    }
    const offer = getActiveOfferForPatient(session.userId);
    setActiveOffer(offer);
  }, [session?.userId]);

  useEffect(() => {
    refreshOffer();

    // Listen to BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel("medivance_slot_offers");
      bc.onmessage = () => {
        refreshOffer();
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "medivance_slot_offers_v1") {
        refreshOffer();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
    };
  }, [refreshOffer]);

  if (!activeOffer) return null;

  const handleClaim = () => {
    setBusy(true);
    claimEarlierSlot(activeOffer.id);
    setTimeout(() => {
      setBusy(false);
      refreshOffer();
    }, 500);
  };

  const handleDecline = () => {
    setBusy(true);
    declineEarlierSlot(activeOffer.id);
    setTimeout(() => {
      setBusy(false);
      refreshOffer();
    }, 400);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-cyan-400 bg-gradient-to-r from-teal-900/30 via-cyan-900/25 to-[#071933] p-4 sm:p-5 shadow-lg backdrop-blur-xl animate-pop dark:border-cyan-400 dark:bg-[#051c38]/95 dark:shadow-[0_0_30px_rgba(0,229,255,0.2)]">
      {/* Background Ambience Sheen */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Info Column */}
        <div className="flex items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-400 text-slate-950 font-bold shadow-md animate-bounce">
            <Zap className="h-6 w-6 fill-slate-950" />
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-cyan-400 text-slate-950 shadow-xs">
                <Sparkles className="h-3 w-3" /> Earlier Slot Available (Cancellation)
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10.5px] font-bold text-emerald-300 border border-emerald-500/40">
                You are #1 in line to take this slot
              </span>
            </div>

            <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
              Want to see {activeOffer.doctorName} earlier at {fmtTime(activeOffer.vacatedTime)}?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
              Another patient just cancelled their consultation on <strong>{fmtDate(activeOffer.date)}</strong>. Because your visit was scheduled later at <strong>{fmtTime(activeOffer.originalTime)}</strong>, you get first priority to move up and save <strong>{activeOffer.timeSavedMinutes} minutes</strong>!
            </p>

            {/* Time Comparison Visual Box */}
            <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 p-2 rounded-xl bg-white/70 dark:bg-[#031126]/80 border border-cyan-500/30 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5 text-muted" />
                <span>Your Current Time:</span>
                <span className="line-through font-semibold text-slate-700 dark:text-slate-300">
                  {fmtTime(activeOffer.originalTime)}
                </span>
              </div>

              <ArrowRight className="h-3.5 w-3.5 text-cyan-500 shrink-0" />

              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Promoted Earlier Slot:</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400/50">
                  {fmtTime(activeOffer.vacatedTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={handleClaim}
            disabled={busy}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5 fill-slate-950" />
            <span>Move to Earlier Slot ({fmtTime(activeOffer.vacatedTime)})</span>
          </button>

          <button
            type="button"
            onClick={handleDecline}
            disabled={busy}
            className="flex items-center gap-1 py-2 px-3 rounded-xl border border-slate-300 bg-white/60 text-slate-700 text-xs font-semibold hover:bg-slate-100 dark:border-cyan-500/30 dark:bg-[#061833]/80 dark:text-slate-300 dark:hover:bg-[#082245] transition active:scale-[0.98]"
            title="Decline this earlier slot and pass it to the next patient in line"
          >
            <X className="h-3.5 w-3.5" />
            <span>Keep My Current Time</span>
          </button>
        </div>
      </div>
    </div>
  );
}
