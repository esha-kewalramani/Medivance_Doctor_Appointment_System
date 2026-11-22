"use client";
import { AppointmentDispatchLog, QueueToken } from "@/types";

const DISPATCH_STORAGE_KEY = "medivance_dispatched_messages_v1";

export function getDispatchLogs(): AppointmentDispatchLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISPATCH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveDispatchLogs(logs: AppointmentDispatchLog[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(logs));
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel("medivance_notifications");
      bc.postMessage({ type: "DISPATCH_UPDATE", logs });
      bc.close();
    }
  } catch {}
}

/**
 * Automatically schedule the 3 required communications upon appointment booking:
 * 1. Immediate Booking Confirmation (SMS + Email)
 * 2. 24 Hours Before Reminder (SMS + Email)
 * 3. 1 Hour Before Reminder (SMS + Email)
 */
export function scheduleAppointmentReminders(params: {
  appointmentId: string;
  patientName: string;
  phone: string;
  email: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  room?: string;
}) {
  const {
    appointmentId,
    patientName,
    phone,
    email,
    doctorName,
    appointmentDate,
    appointmentTime,
    room = "Room 102 - OPD Heart Wing",
  } = params;

  const now = new Date();
  const apptDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);

  // Calculate 24h before & 30m before timestamps
  const time24hBefore = new Date(apptDateTime.getTime() - 24 * 60 * 60 * 1000);
  const time30mBefore = new Date(apptDateTime.getTime() - 30 * 60 * 1000);

  // If appointment is already within 24h or 30m, mark reminder as delivered/due
  const is24hDue = now >= time24hBefore;
  const is30mDue = now >= time30mBefore;

  const newLogs: AppointmentDispatchLog[] = [
    // 1. Instant Confirmation SMS
    {
      id: `disp-conf-sms-${appointmentId}`,
      appointmentId,
      patientName,
      phone,
      email,
      doctorName,
      appointmentDate,
      appointmentTime,
      channel: "SMS",
      type: "CONFIRMATION",
      title: "Booking Confirmed",
      message: `MEDIVANCE Confirmed: Dear ${patientName}, your appointment with ${doctorName} is confirmed for ${appointmentDate} at ${appointmentTime} (${room}). Live queue token will be active on visit day.`,
      scheduledFor: now.toISOString(),
      sentAt: now.toISOString(),
      status: "delivered",
    },
    // 1. Instant Confirmation Email
    {
      id: `disp-conf-email-${appointmentId}`,
      appointmentId,
      patientName,
      phone,
      email,
      doctorName,
      appointmentDate,
      appointmentTime,
      channel: "EMAIL",
      type: "CONFIRMATION",
      title: `Confirmed: Consultation with ${doctorName}`,
      message: `Dear ${patientName},\n\nYour appointment with ${doctorName} has been booked successfully.\n\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nLocation: ${room}\n\nPlease check in 10 minutes prior to your scheduled time. You can view your real-time queue status directly in your MEDIVANCE Patient Portal.\n\nWarm regards,\nMEDIVANCE Healthcare System`,
      scheduledFor: now.toISOString(),
      sentAt: now.toISOString(),
      status: "delivered",
    },
    // 2. 24 Hours Before Reminder SMS
    {
      id: `disp-24h-sms-${appointmentId}`,
      appointmentId,
      patientName,
      phone,
      email,
      doctorName,
      appointmentDate,
      appointmentTime,
      channel: "SMS",
      type: "REMINDER_24H",
      title: "24-Hour Reminder",
      message: `MEDIVANCE Reminder: Your consultation with ${doctorName} is tomorrow at ${appointmentTime}. Location: ${room}. Fast-track pre-checkin is available on your dashboard.`,
      scheduledFor: time24hBefore.toISOString(),
      sentAt: is24hDue ? now.toISOString() : undefined,
      status: is24hDue ? "delivered" : "scheduled",
    },
    // 2. 24 Hours Before Reminder Email
    {
      id: `disp-24h-email-${appointmentId}`,
      appointmentId,
      patientName,
      phone,
      email,
      doctorName,
      appointmentDate,
      appointmentTime,
      channel: "EMAIL",
      type: "REMINDER_24H",
      title: `Reminder (Tomorrow): Appointment with ${doctorName}`,
      message: `Dear ${patientName},\n\nThis is a friendly reminder that you have an appointment with ${doctorName} tomorrow at ${appointmentTime}.\n\nClinic: ${room}\nDate: ${appointmentDate}\n\nPlease remember to bring your previous prescriptions and medical records if applicable.\n\nMEDIVANCE Healthcare System`,
      scheduledFor: time24hBefore.toISOString(),
      sentAt: is24hDue ? now.toISOString() : undefined,
      status: is24hDue ? "delivered" : "scheduled",
    },
    // 3. 30 Minutes Before Urgent Departure Alert SMS
    {
      id: `disp-30m-sms-${appointmentId}`,
      appointmentId,
      patientName,
      phone,
      email,
      doctorName,
      appointmentDate,
      appointmentTime,
      channel: "SMS",
      type: "REMINDER_30M",
      title: "30-Minute Urgent Alert",
      message: `MEDIVANCE 30-MIN ALERT: Dear ${patientName}, your consultation with ${doctorName} starts in 30 minutes at ${appointmentTime} (${room}). Please proceed to the clinic now! Your live OPD queue token is active.`,
      scheduledFor: time30mBefore.toISOString(),
      sentAt: is30mDue ? now.toISOString() : undefined,
      status: is30mDue ? "delivered" : "scheduled",
    },
    // 3. 30 Minutes Before Urgent Departure Alert Email
    {
      id: `disp-30m-email-${appointmentId}`,
      appointmentId,
      patientName,
      phone,
      email,
      doctorName,
      appointmentDate,
      appointmentTime,
      channel: "EMAIL",
      type: "REMINDER_30M",
      title: `30-Minute Departure Alert: ${doctorName} at ${appointmentTime}`,
      message: `Dear ${patientName},\n\nYour consultation with ${doctorName} starts in 30 minutes at ${appointmentTime}.\n\nLocation: ${room}\n\nPlease proceed to the hospital OPD wing now. You can bypass the reception queue by scanning your digital gate pass or tapping Fast-Track Arrival on your portal.\n\nMEDIVANCE Healthcare System`,
      scheduledFor: time30mBefore.toISOString(),
      sentAt: is30mDue ? now.toISOString() : undefined,
      status: is30mDue ? "delivered" : "scheduled",
    },
  ];

  const existing = getDispatchLogs().filter((l) => l.appointmentId !== appointmentId);
  const combined = [...newLogs, ...existing];
  saveDispatchLogs(combined);
  return newLogs;
}

/**
 * Dispatch an instant SMS/Email when a patient is called into the doctor's room
 */
export function sendQueueSummonAlert(token: QueueToken, phone = "+92 300 1234567", email = "patient@medivance.pk") {
  const now = new Date().toISOString();
  const alertSms: AppointmentDispatchLog = {
    id: `disp-summon-sms-${token.id}-${Date.now()}`,
    appointmentId: token.appointmentId,
    patientName: token.patientName,
    phone,
    email,
    doctorName: token.doctorName,
    appointmentDate: token.date,
    appointmentTime: token.time,
    channel: "SMS",
    type: "QUEUE_SUMMON",
    title: "Now Calling Token",
    message: `📢 MEDIVANCE ALERT: Token #${token.tokenNumber} (${token.patientName}) is being called right now by ${token.doctorName}. Please proceed directly to ${token.room}.`,
    scheduledFor: now,
    sentAt: now,
    status: "delivered",
  };

  const existing = getDispatchLogs();
  saveDispatchLogs([alertSms, ...existing]);
}

/**
 * Dispatch an urgent alert when previous session completes early and next patient is up next
 */
export function sendNextInLineAlert(token: QueueToken, isEarly = true, phone = "+92 300 1234567", email = "patient@medivance.pk") {
  const now = new Date().toISOString();
  const alertSms: AppointmentDispatchLog = {
    id: `disp-next-line-sms-${token.id}-${Date.now()}`,
    appointmentId: token.appointmentId,
    patientName: token.patientName,
    phone,
    email,
    doctorName: token.doctorName,
    appointmentDate: token.date,
    appointmentTime: token.time,
    channel: "SMS",
    type: "QUEUE_SUMMON",
    title: isEarly ? "Early Session: You Are Next in Line!" : "You Are Next in Line",
    message: isEarly
      ? `⚡ MEDIVANCE Fast-Track Alert: Dr. ${token.doctorName} finished the prior consultation early! Token #${token.tokenNumber} (${token.patientName}), you are NEXT IN LINE. Please proceed to ${token.room} and be ready to enter.`
      : `MEDIVANCE Update: Token #${token.tokenNumber} (${token.patientName}), you are next in line for Dr. ${token.doctorName} in ${token.room}. Please be ready.`,
    scheduledFor: now,
    sentAt: now,
    status: "delivered",
  };

  const alertEmail: AppointmentDispatchLog = {
    id: `disp-next-line-email-${token.id}-${Date.now()}`,
    appointmentId: token.appointmentId,
    patientName: token.patientName,
    phone,
    email,
    doctorName: token.doctorName,
    appointmentDate: token.date,
    appointmentTime: token.time,
    channel: "EMAIL",
    type: "QUEUE_SUMMON",
    title: `⚡ Next In Line: Dr. ${token.doctorName} (${token.room})`,
    message: `Dear ${token.patientName},\n\nDr. ${token.doctorName} has finished the previous session ahead of schedule. Your token (#${token.tokenNumber}) is now next in line!\n\nPlease make your way directly to ${token.room} so there is no delay when your token is summoned.\n\nMEDIVANCE Healthcare System`,
    scheduledFor: now,
    sentAt: now,
    status: "delivered",
  };

  const existing = getDispatchLogs();
  saveDispatchLogs([alertSms, alertEmail, ...existing]);
}

/**
 * Manually trigger dispatch of a scheduled reminder (for simulation/testing)
 */
export function triggerSimulatedDispatch(logId: string): AppointmentDispatchLog | null {
  const logs = getDispatchLogs();
  let updatedLog: AppointmentDispatchLog | null = null;

  const next = logs.map((l) => {
    if (l.id === logId) {
      updatedLog = {
        ...l,
        status: "delivered" as const,
        sentAt: new Date().toISOString(),
      };
      return updatedLog;
    }
    return l;
  });

  if (updatedLog) {
    saveDispatchLogs(next);
  }
  return updatedLog;
}
