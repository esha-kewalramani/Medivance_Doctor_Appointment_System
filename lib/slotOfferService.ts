"use client";
import { Appointment, Doctor, Patient } from "@/types";
import { fmtDate, fmtTime, uid } from "@/lib/utilities";

export interface SlotOffer {
  id: string;
  cancelledAppointmentId: string;
  targetAppointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  date: string;
  vacatedTime: string;  // Earlier vacated slot (e.g. "10:00")
  originalTime: string; // Patient's later scheduled slot (e.g. "12:00")
  status: "offered" | "accepted" | "declined";
  offeredAt: string;
  timeSavedMinutes: number;
}

const STORAGE_KEY = "medivance_slot_offers_v1";

export function getSlotOffers(): SlotOffer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SlotOffer[]) : [];
  } catch {
    return [];
  }
}

export function saveSlotOffers(offers: SlotOffer[], broadcast = true): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
    if (broadcast && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("medivance_slot_offers");
      bc.postMessage({ type: "SLOT_OFFERS_UPDATED", offers });
      bc.close();
    }
  } catch {}
}

/** Returns the active pending offer for a specific patient, if any */
export function getActiveOfferForPatient(patientId: string): SlotOffer | null {
  const offers = getSlotOffers();
  return offers.find((o) => o.patientId === patientId && o.status === "offered") || null;
}

/**
 * When an appointment is cancelled, this finds the first upcoming patient scheduled
 * later on the same day for this doctor, and offers them the earlier vacated slot.
 */
export function createSlotOfferOnCancellation({
  cancelledAppt,
  allAppts,
  doctors,
  patients,
}: {
  cancelledAppt: Appointment;
  allAppts: Appointment[];
  doctors: Doctor[];
  patients: Patient[];
}): SlotOffer | null {
  // Find all patients with appointments for this doctor on the same date with time > cancelledAppt.time
  const laterAppts = allAppts
    .filter(
      (a) =>
        a.id !== cancelledAppt.id &&
        a.doctorId === cancelledAppt.doctorId &&
        a.date === cancelledAppt.date &&
        a.time > cancelledAppt.time &&
        ["pending", "approved"].includes(a.status)
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  if (laterAppts.length === 0) return null;

  // The very first upcoming patient has first priority!
  const targetAppt = laterAppts[0];
  const targetPatient = patients.find((p) => p.id === targetAppt.patientId);
  const doc = doctors.find((d) => d.id === cancelledAppt.doctorId);

  // Calculate time saved in minutes
  const parseMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const diffMinutes = Math.max(15, parseMin(targetAppt.time) - parseMin(cancelledAppt.time));

  const newOffer: SlotOffer = {
    id: `offer-${uid("so")}`,
    cancelledAppointmentId: cancelledAppt.id,
    targetAppointmentId: targetAppt.id,
    patientId: targetAppt.patientId,
    patientName: targetPatient?.name || (targetAppt.isGuest && targetAppt.guestDetails?.name) || "Valued Patient",
    patientPhone: targetPatient?.phone || (targetAppt.isGuest && targetAppt.guestDetails?.phone) || "+92 314 5678900",
    patientEmail: targetPatient?.email || (targetAppt.isGuest && targetAppt.guestDetails?.email) || "patient@medivance.pk",
    doctorId: cancelledAppt.doctorId,
    doctorName: doc?.name || "Dr. Specialist",
    date: cancelledAppt.date,
    vacatedTime: cancelledAppt.time,
    originalTime: targetAppt.time,
    status: "offered",
    offeredAt: new Date().toISOString(),
    timeSavedMinutes: diffMinutes,
  };

  const existing = getSlotOffers().filter(
    (o) => o.targetAppointmentId !== targetAppt.id && o.vacatedTime !== cancelledAppt.time
  );
  saveSlotOffers([newOffer, ...existing]);

  return newOffer;
}

/** Mark offer as accepted */
export function acceptOffer(offerId: string): SlotOffer | null {
  const offers = getSlotOffers();
  let accepted: SlotOffer | null = null;
  const updated = offers.map((o) => {
    if (o.id === offerId) {
      accepted = { ...o, status: "accepted" as const };
      return accepted;
    }
    return o;
  });

  saveSlotOffers(updated);
  return accepted;
}

/**
 * If the first patient declines the earlier slot, offer it to the NEXT candidate in line!
 */
export function declineOfferAndPromoteNext({
  offerId,
  allAppts,
  doctors,
  patients,
}: {
  offerId: string;
  allAppts: Appointment[];
  doctors: Doctor[];
  patients: Patient[];
}): { declined: SlotOffer | null; nextOffer: SlotOffer | null } {
  const offers = getSlotOffers();
  const current = offers.find((o) => o.id === offerId);
  if (!current) return { declined: null, nextOffer: null };

  const updatedOffers = offers.map((o) => (o.id === offerId ? { ...o, status: "declined" as const } : o));

  // Find remaining candidates later than the vacated time, excluding the declined patient
  const remainingCandidates = allAppts
    .filter(
      (a) =>
        a.id !== current.targetAppointmentId &&
        a.doctorId === current.doctorId &&
        a.date === current.date &&
        a.time > current.vacatedTime &&
        a.time > current.originalTime &&
        ["pending", "approved"].includes(a.status)
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  let nextOffer: SlotOffer | null = null;

  if (remainingCandidates.length > 0) {
    const nextTarget = remainingCandidates[0];
    const targetPatient = patients.find((p) => p.id === nextTarget.patientId);
    const doc = doctors.find((d) => d.id === current.doctorId);

    const parseMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const diffMinutes = Math.max(15, parseMin(nextTarget.time) - parseMin(current.vacatedTime));

    nextOffer = {
      id: `offer-${uid("so")}`,
      cancelledAppointmentId: current.cancelledAppointmentId,
      targetAppointmentId: nextTarget.id,
      patientId: nextTarget.patientId,
      patientName: targetPatient?.name || (nextTarget.isGuest && nextTarget.guestDetails?.name) || "Valued Patient",
      patientPhone: targetPatient?.phone || (nextTarget.isGuest && nextTarget.guestDetails?.phone) || "+92 314 5678900",
      patientEmail: targetPatient?.email || (nextTarget.isGuest && nextTarget.guestDetails?.email) || "patient@medivance.pk",
      doctorId: current.doctorId,
      doctorName: doc?.name || "Dr. Specialist",
      date: current.date,
      vacatedTime: current.vacatedTime,
      originalTime: nextTarget.time,
      status: "offered",
      offeredAt: new Date().toISOString(),
      timeSavedMinutes: diffMinutes,
    };

    saveSlotOffers([nextOffer, ...updatedOffers]);
  } else {
    saveSlotOffers(updatedOffers);
  }

  return { declined: current, nextOffer };
}
