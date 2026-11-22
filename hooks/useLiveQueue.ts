"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { QueueToken, QueueItemStatus, TriageBrief } from "@/types";
import { useApp } from "@/hooks/useApp";
import { todayISO, toMin } from "@/lib/utilities";
import { announcePatientCall, playHospitalChime, sendBrowserNotification, stopAnnouncement } from "@/lib/audioAlert";
import { sendQueueSummonAlert, sendNextInLineAlert } from "@/lib/notificationService";

const QUEUE_STORAGE_KEY = "medivance_live_queue_v1";

export function useLiveQueue() {
  const { data, session, setStatus } = useApp();
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load from LocalStorage
  const loadTokens = useCallback(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as QueueToken[];
      }
    } catch {
      // ignore JSON parse error
    }
    return [];
  }, []);

  // Save to LocalStorage & BroadcastChannel
  const saveTokens = useCallback((newTokens: QueueToken[], broadcast = true) => {
    setTokens(newTokens);
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newTokens));
      if (broadcast && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("medivance_live_queue");
        bc.postMessage({ type: "QUEUE_UPDATE", tokens: newTokens });
        bc.close();
      }
    } catch {
      // ignore
    }
  }, []);

  // Initialize today's queue strictly from REAL hospital appointments
  useEffect(() => {
    const today = todayISO();
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const existing = loadTokens().filter((t) => !t.id.includes("-demo-") && !t.id.includes("-live-") && t.date === today);

    // Build real queue from today's approved/pending/completed appointments
    const todaysAppts = (data.appointments || [])
      .filter((a) => a.date === today && ["approved", "pending", "completed"].includes(a.status))
      .sort((a, b) => (a.time > b.time ? 1 : -1));

    let tokenSeq = 10;
    const realTokens: QueueToken[] = todaysAppts.map((a) => {
      tokenSeq += 1;
      const doc = data.doctors.find((d) => d.id === a.doctorId);
      const pat = data.patients.find((p) => p.id === a.patientId);
      const slotDuration = doc?.slotMinutes || 30;
      const apptMin = toMin(a.time);
      const isPastSlot = apptMin + slotDuration <= nowMin;

      const existingToken = existing.find((t) => t.appointmentId === a.id);
      if (existingToken) {
        // Keep status in sync if appointment itself was marked completed
        if (a.status === "completed" && existingToken.status !== "completed") {
          return { ...existingToken, status: "completed" };
        }
        // If scheduled slot window elapsed while portal was closed, mark as passed so it is not auto-summoned
        if (existingToken.status === "waiting" && isPastSlot) {
          return { ...existingToken, status: "passed" };
        }
        return existingToken;
      }

      return {
        id: `token-${a.id}`,
        tokenNumber: tokenSeq,
        appointmentId: a.id,
        patientId: a.patientId,
        patientName: a.guestDetails?.name || pat?.name || "Patient",
        doctorId: a.doctorId,
        doctorName: doc?.name || "Dr. Specialist",
        specialization: doc?.specialization || "General Medicine",
        date: today,
        time: a.time,
        room: `Room 102 - OPD Heart Wing`,
        status: a.status === "completed" ? "completed" : isPastSlot ? "passed" : "waiting",
        estimatedWaitMinutes: Math.max(5, (tokenSeq - 10) * 15),
      };
    });

    saveTokens(realTokens, false);
    setInitialized(true);
  }, [data.appointments, data.doctors, data.patients, loadTokens, saveTokens]);

  // Listen for BroadcastChannel & storage events across tabs & windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === QUEUE_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as QueueToken[];
          setTokens(parsed);
        } catch {}
      }
    };

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel("medivance_live_queue");
      bc.onmessage = (msg) => {
        if (msg.data?.type === "QUEUE_UPDATE" && msg.data?.tokens) {
          setTokens(msg.data.tokens);
        } else if (msg.data?.type === "STOP_ANNOUNCEMENT") {
          stopAnnouncement(false);
        } else if (msg.data?.type === "TOKEN_CALLED") {
          const calledToken = msg.data.token as QueueToken;
          announcePatientCall(calledToken.tokenNumber, calledToken.patientName, calledToken.room);

          if (session?.userId && calledToken.patientId === session.userId) {
            sendBrowserNotification("🔔 MEDIVANCE: Your Token is Called!", {
              body: `Token #${calledToken.tokenNumber} — ${calledToken.doctorName} is ready for you in ${calledToken.room}. Please proceed now!`,
            });
          }
        }
      };
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
    };
  }, [session?.userId]);

  // Doctor Action: Call Next Patient in queue (Strictly honors scheduled appointment times)
  const callNextPatient = useCallback((doctorId?: string, forceAnyUpcoming = false) => {
    setTokens((prev) => {
      const today = todayISO();
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();

      // Find the first patient waiting for this doctor whose appointment time has arrived
      // (If forceAnyUpcoming is false, future-scheduled patients are not summoned before their time)
      const targetIndex = prev.findIndex((t) => {
        if (t.date !== today || t.status !== "waiting") return false;
        if (doctorId && t.doctorId !== doctorId) return false;
        const apptMin = toMin(t.time);
        return forceAnyUpcoming || apptMin <= nowMin;
      });

      if (targetIndex === -1) return prev;

      const updated = prev.map((t, idx) => {
        // Complete any previously calling patient for this doctor
        if (t.status === "calling" && (!doctorId || t.doctorId === doctorId)) {
          return { ...t, status: "completed" as QueueItemStatus, completedAt: new Date().toISOString() };
        }
        if (idx === targetIndex) {
          return { ...t, status: "calling" as QueueItemStatus, calledAt: new Date().toISOString() };
        }
        return t;
      });

      saveTokens(updated);

      // Play Chime locally and broadcast
      const calledToken = updated[targetIndex];
      announcePatientCall(calledToken.tokenNumber, calledToken.patientName, calledToken.room);
      sendQueueSummonAlert(calledToken);

      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("medivance_live_queue");
        bc.postMessage({ type: "TOKEN_CALLED", token: calledToken });
        bc.close();
      }

      return updated;
    });
  }, [saveTokens]);

  // Doctor Action: Set patient to "In Consultation"
  const startConsultation = useCallback((tokenId: string) => {
    setTokens((prev) => {
      const updated = prev.map((t) =>
        t.id === tokenId ? { ...t, status: "in_consultation" as QueueItemStatus, startedAt: new Date().toISOString() } : t
      );
      saveTokens(updated);
      return updated;
    });
  }, [saveTokens]);

  // Doctor Action: Complete visit (with optional early completion notice)
  const completeConsultation = useCallback((tokenId: string, isEarly = false) => {
    // Immediately stop any active voice/chime announcement across all tabs
    stopAnnouncement(true);
    setTokens((prev) => {
      const today = todayISO();
      let targetDoctorId: string | undefined;

      const updated = prev.map((t) => {
        if (t.id === tokenId) {
          targetDoctorId = t.doctorId;
          if (t.appointmentId && setStatus) {
            setStatus(t.appointmentId, "completed");
          }
          return { ...t, status: "completed" as QueueItemStatus, completedAt: new Date().toISOString() };
        }
        return t;
      });

      // Find the upcoming waiting patient for this doctor
      const nextWaiting = updated.find(
        (t) => t.date === today && t.status === "waiting" && (!targetDoctorId || t.doctorId === targetDoctorId)
      );

      if (nextWaiting) {
        // Dispatches immediate Fast-Track SMS/Email to next customer
        sendNextInLineAlert(nextWaiting, isEarly);
        if (isEarly) {
          announcePatientCall(nextWaiting.tokenNumber, nextWaiting.patientName, `${nextWaiting.room}. Please get ready, doctor is free.`);
        }
      }

      saveTokens(updated);
      return updated;
    });
  }, [saveTokens, setStatus]);

  // Undo / Reopen consultation if accidentally completed
  const undoComplete = useCallback((tokenId: string) => {
    setTokens((prev) => {
      const updated = prev.map((t) => {
        if (t.id === tokenId) {
          if (t.appointmentId && setStatus) {
            setStatus(t.appointmentId, "approved");
          }
          return { ...t, status: "in_consultation" as QueueItemStatus };
        }
        return t;
      });
      saveTokens(updated);
      return updated;
    });
  }, [saveTokens, setStatus]);

  // Patient Action: Submit 45-second quick triage check-in
  const submitTriageBrief = useCallback((tokenId: string, brief: TriageBrief) => {
    setTokens((prev) => {
      const updated = prev.map((t) =>
        t.id === tokenId ? { ...t, triageBrief: brief } : t
      );
      saveTokens(updated);

      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("medivance_live_queue");
        bc.postMessage({ type: "QUEUE_UPDATE", tokens: updated });
        bc.close();
      }

      return updated;
    });
  }, [saveTokens]);

  // Patient Action: 1-Click Fast-Track GPS Reception Check-In
  const checkInAtHospital = useCallback((tokenId: string) => {
    setTokens((prev) => {
      const updated = prev.map((t) =>
        t.id === tokenId
          ? {
              ...t,
              arrivedStatus: "in_lobby" as const,
              arrivedAt: new Date().toISOString(),
            }
          : t
      );
      saveTokens(updated);

      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("medivance_live_queue");
        bc.postMessage({ type: "QUEUE_UPDATE", tokens: updated });
        bc.close();
      }

      return updated;
    });
  }, [saveTokens]);

  // Patient helper: find current user's active token from real appointment
  const myToken = useMemo(() => {
    const pid = session?.userId || "p1";
    const today = todayISO();
    return tokens.find((t) => t.patientId === pid && t.date === today) || null;
  }, [tokens, session?.userId]);

  // Doctor helper: find currently calling or in-consultation token
  const currentCallingToken = useMemo(() => {
    const today = todayISO();
    return tokens.find((t) => t.date === today && (t.status === "calling" || t.status === "in_consultation")) || null;
  }, [tokens]);

  return {
    tokens,
    initialized,
    myToken,
    currentCallingToken,
    callNextPatient,
    startConsultation,
    completeConsultation,
    undoComplete,
    submitTriageBrief,
    checkInAtHospital,
  };
}
