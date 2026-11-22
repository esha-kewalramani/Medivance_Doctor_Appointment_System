"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  Radio,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { AppointmentDispatchLog } from "@/types";
import {
  getDispatchLogs,
  saveDispatchLogs,
  scheduleAppointmentReminders,
} from "@/lib/notificationService";
import { useApp } from "@/hooks/useApp";

export default function AutomatedRemindersCard() {
  const { user, data } = useApp();
  const [logs, setLogs] = useState<AppointmentDispatchLog[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<AppointmentDispatchLog | null>(null);
  const [activeTab, setActiveTab] = useState<"SMS" | "EMAIL">("SMS");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync logs and ensure current user's appointment has reminders scheduled
  useEffect(() => {
    let currentLogs = getDispatchLogs();

    // Find patient's appointment
    const patientAppt = data.appointments?.find(
      (a) => a.patientId === (user?.id || "p1")
    );

    if (patientAppt && !currentLogs.some((l) => l.appointmentId === patientAppt.id)) {
      const doc = data.doctors.find((d) => d.id === patientAppt.doctorId);
      currentLogs = scheduleAppointmentReminders({
        appointmentId: patientAppt.id,
        patientName: user?.name || "Esha Kewalramani",
        phone: user?.phone || "+92 314 5678900",
        email: user?.email || "esha1239@gmail.com",
        doctorName: doc?.name || "Dr. Ayesha Khan",
        appointmentDate: patientAppt.date,
        appointmentTime: patientAppt.time,
        room: "Room 102 - OPD Heart Wing",
      });
    }

    // Realistic Real-Time Auto-Dispatch Ticker:
    // If wall-clock time has reached 24h or 1h threshold, automatically flip to DELIVERED without any user interaction
    const now = new Date();
    let updatedAny = false;
    const updatedLogs = currentLogs.map((l) => {
      if (l.status === "scheduled" && new Date(l.scheduledFor) <= now) {
        updatedAny = true;
        return {
          ...l,
          status: "delivered" as const,
          sentAt: l.sentAt || now.toISOString(),
        };
      }
      return l;
    });

    if (updatedAny) {
      saveDispatchLogs(updatedLogs);
      setLogs(updatedLogs);
    } else {
      setLogs(currentLogs);
    }

    // Listen for cross-tab broadcasts
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel("medivance_notifications");
      bc.onmessage = (msg) => {
        if (msg.data?.type === "DISPATCH_UPDATE" && msg.data?.logs) {
          setLogs(msg.data.logs);
        }
      };
    }

    return () => {
      if (bc) bc.close();
    };
  }, [user, data.appointments, data.doctors]);

  // Periodic check every 10 seconds to auto-deliver when time arrives
  useEffect(() => {
    const timer = setInterval(() => {
      const currentLogs = getDispatchLogs();
      const now = new Date();
      let changed = false;

      const next = currentLogs.map((l) => {
        if (l.status === "scheduled" && new Date(l.scheduledFor) <= now) {
          changed = true;
          return {
            ...l,
            status: "delivered" as const,
            sentAt: now.toISOString(),
          };
        }
        return l;
      });

      if (changed) {
        saveDispatchLogs(next);
        setLogs(next);
      }
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const openPreview = (type: "CONFIRMATION" | "REMINDER_24H" | "REMINDER_1H" | "REMINDER_30M", channel: "SMS" | "EMAIL") => {
    setActiveTab(channel);
    const target = logs.find((l) => (l.type === type || (type === "REMINDER_30M" && l.type === "REMINDER_1H")) && l.channel === channel);
    if (target) {
      setSelectedPreview(target);
    }
  };

  const recipientPhone = user?.phone || "03145678900";
  const recipientEmail = user?.email || "esha1239@gmail.com";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-cyan-500/30 dark:bg-[#06152b]/90 dark:shadow-[0_0_30px_rgba(0,180,216,0.18)]">
      {/* Background Ambience Sheen */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl dark:bg-cyan-500/15" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-teal-700 dark:bg-cyan-950/80 dark:border dark:border-cyan-400/40 dark:text-cyan-300">
            <Smartphone className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-white">
                Automated SMS & Email Reminders
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Auto-dispatched 24 hours &amp; 30 minutes prior to appointment to verified contact number &amp; email
            </p>
          </div>
        </div>

        {/* Contact info pill */}
        <div className="flex items-center gap-3 text-xs bg-slate-100 dark:bg-[#071d38] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-cyan-500/30">
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-cyan-300 font-medium">
            <Phone className="h-3.5 w-3.5 text-teal-600 dark:text-cyan-400" />
            {recipientPhone}
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-cyan-300 font-medium truncate max-w-[190px]">
            <Mail className="h-3.5 w-3.5 text-teal-600 dark:text-cyan-400" />
            {recipientEmail}
          </span>
        </div>
      </div>

      {/* Grid of 3 Scheduled Triggers */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. Instant Confirmation */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-cyan-500/20 dark:bg-[#071d38]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                1. Booking Confirmation
              </span>
              <span className="text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5">
                Delivered
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Instant SMS & Email confirmation containing visit details, clinic room, and tracking reference.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-cyan-500/20 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 dark:text-slate-500">Auto-sent on booking</span>
            <button
              onClick={() => openPreview("CONFIRMATION", "SMS")}
              className="inline-flex items-center gap-1 text-teal-700 dark:text-cyan-400 font-semibold hover:underline"
            >
              <span>View Message</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 2. 24 Hours Before Reminder */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-cyan-500/20 dark:bg-[#071d38]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                2. 24h Before Reminder
              </span>
              {logs.some((l) => l.type === "REMINDER_24H" && l.status === "delivered") ? (
                <span className="text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5">
                  Delivered
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase rounded-md bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 px-2 py-0.5 animate-pulse">
                  Auto-Scheduled
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Sent 24 hours prior to consultation so patient remembers date, time, and doctor preparations.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-cyan-500/20 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 dark:text-slate-500">
              {logs.some((l) => l.type === "REMINDER_24H" && l.status === "delivered")
                ? "Auto-delivered on schedule"
                : "Auto-sends 24h prior"}
            </span>
            <button
              onClick={() => openPreview("REMINDER_24H", "SMS")}
              className="inline-flex items-center gap-1 text-teal-700 dark:text-cyan-400 font-semibold hover:underline"
            >
              <span>{logs.some((l) => l.type === "REMINDER_24H" && l.status === "delivered") ? "View Message" : "Preview SMS"}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 3. 30 Minutes Before Urgent Departure Alert */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-cyan-500/20 dark:bg-[#071d38]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                <Bell className="h-4 w-4 text-amber-500" />
                3. 30m Before Urgent Departure Alert
              </span>
              {logs.some((l) => (l.type === "REMINDER_30M" || l.type === "REMINDER_1H") && l.status === "delivered") ? (
                <span className="text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5">
                  Delivered
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase rounded-md bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 px-2 py-0.5">
                  Auto-Scheduled
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Urgent departure reminder auto-dispatched 30 minutes before visit to patient&apos;s mobile number. Tells patient to proceed to clinic OPD room.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-cyan-500/20 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 dark:text-slate-500">
              {logs.some((l) => (l.type === "REMINDER_30M" || l.type === "REMINDER_1H") && l.status === "delivered")
                ? "Auto-delivered on schedule"
                : "Auto-sends 30m prior"}
            </span>
            <button
              onClick={() => openPreview("REMINDER_30M", "SMS")}
              className="inline-flex items-center gap-1 text-teal-700 dark:text-cyan-400 font-semibold hover:underline"
            >
              <span>{logs.some((l) => (l.type === "REMINDER_30M" || l.type === "REMINDER_1H") && l.status === "delivered") ? "View Message" : "Preview SMS"}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* REALISTIC PREVIEW MODAL: Realistic Phone SMS & Hospital Email View (Portaled to document.body) */}
      {mounted && selectedPreview && createPortal(
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPreview(null)}
        >
          <div
            className="w-full max-w-lg my-auto max-h-[88vh] overflow-y-auto animate-pop rounded-3xl border border-cyan-400/40 bg-[#071a33] p-6 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Sticky) */}
            <div className="sticky top-0 z-10 bg-[#071a33] flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-cyan-400" />
                <h4 className="font-bold text-sm text-white">
                  Automated Dispatch Record
                </h4>
              </div>
              <button
                onClick={() => setSelectedPreview(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Channel Tabs: SMS / Email */}
            <div className="mt-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                onClick={() => {
                  const match = logs.find(
                    (l) => l.type === selectedPreview.type && l.channel === "SMS"
                  );
                  if (match) setSelectedPreview(match);
                  setActiveTab("SMS");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "SMS"
                    ? "bg-teal-700 text-white dark:bg-cyan-500 dark:text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>SMS Gateway ({recipientPhone})</span>
              </button>

              <button
                onClick={() => {
                  const match = logs.find(
                    (l) => l.type === selectedPreview.type && l.channel === "EMAIL"
                  );
                  if (match) setSelectedPreview(match);
                  setActiveTab("EMAIL");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "EMAIL"
                    ? "bg-teal-700 text-white dark:bg-cyan-500 dark:text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Email Client ({recipientEmail})</span>
              </button>
            </div>

            {/* Details Meta */}
            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Trigger Event:</span>
                <span className="font-semibold text-teal-700 dark:text-cyan-400">
                  {selectedPreview.type === "CONFIRMATION"
                    ? "Instant Booking Confirmation"
                    : selectedPreview.type === "REMINDER_24H"
                    ? "24-Hour Before Consultation Reminder"
                    : "1-Hour Before Urgent Departure Alert"}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>System Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {selectedPreview.status}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Destination:</span>
                <strong className="text-slate-800 dark:text-white">
                  {selectedPreview.channel === "SMS" ? recipientPhone : recipientEmail}
                </strong>
              </div>

              {/* Realistic Message Container */}
              {activeTab === "SMS" ? (
                /* Phone SMS Bubble */
                <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-100 p-4 dark:border-cyan-500/30 dark:bg-[#031024]">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span>Sender: <strong>MEDIVANCE-ALERTS</strong></span>
                    <span>SMS Gateway</span>
                  </div>
                  <div className="mt-3 inline-block rounded-2xl bg-teal-600 px-4 py-3 text-xs text-white shadow-sm dark:bg-cyan-700 leading-relaxed font-sans max-w-[90%]">
                    {selectedPreview.message}
                  </div>
                </div>
              ) : (
                /* Hospital Email Card */
                <div className="mt-4 rounded-xl border border-slate-300 bg-slate-50 p-4 dark:border-cyan-500/30 dark:bg-[#031024]">
                  <div className="text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                    <p><strong>From:</strong> appointments@medivance.pk</p>
                    <p><strong>Subject:</strong> {selectedPreview.title}</p>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-xs text-slate-800 dark:text-slate-200 font-sans">
                    {selectedPreview.message}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-10 bg-[#071a33] mt-5 pt-3 border-t border-cyan-500/20 flex justify-end">
              <button
                onClick={() => setSelectedPreview(null)}
                className="py-2 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
