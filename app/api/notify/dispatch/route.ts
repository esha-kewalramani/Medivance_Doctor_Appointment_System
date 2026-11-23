import { NextRequest, NextResponse } from "next/server";
import { sendEmailWithResend } from "@/lib/email/resend";
import { sendSmsWithTwilio } from "@/lib/sms/twilio";

export interface DispatchPayload {
  patientName: string;
  phone?: string;
  email?: string;
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  room?: string;
  tokenNumber?: number | string;
  type?: "CONFIRMATION" | "REMINDER_24H" | "REMINDER_30M" | "QUEUE_SUMMON" | "CUSTOM";
  smsMessage?: string;
  emailSubject?: string;
  emailBody?: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload: DispatchPayload = await req.json();

    const {
      patientName,
      phone,
      email,
      doctorName,
      appointmentDate,
      appointmentTime,
      room = "Room 102 - OPD Heart Wing",
      tokenNumber,
      type = "CONFIRMATION",
      smsMessage,
      emailSubject,
      emailBody,
    } = payload;

    // Default subject and SMS message generator based on notification type
    let finalSubject = emailSubject;
    let finalSms = smsMessage;

    if (!finalSubject) {
      if (type === "CONFIRMATION") {
        finalSubject = `Confirmed: Consultation with ${doctorName || "Doctor"}`;
      } else if (type === "REMINDER_24H") {
        finalSubject = `Reminder (Tomorrow): Appointment with ${doctorName || "Doctor"}`;
      } else if (type === "REMINDER_30M") {
        finalSubject = `Urgent 30-Min Alert: Consultation with ${doctorName || "Doctor"}`;
      } else if (type === "QUEUE_SUMMON") {
        finalSubject = `📢 You Are Being Called: ${doctorName || "Clinic"} (${room})`;
      } else {
        finalSubject = `MEDIVANCE Notification for ${patientName}`;
      }
    }

    if (!finalSms) {
      if (type === "CONFIRMATION") {
        finalSms = `MEDIVANCE Confirmed: Dear ${patientName}, your appointment with ${doctorName} is confirmed for ${appointmentDate} at ${appointmentTime} (${room}). Live queue token active on visit day.`;
      } else if (type === "REMINDER_24H") {
        finalSms = `MEDIVANCE Reminder: Your consultation with ${doctorName} is tomorrow at ${appointmentTime} (${room}). Please arrive 10 min prior.`;
      } else if (type === "REMINDER_30M") {
        finalSms = `MEDIVANCE 30-MIN ALERT: Dear ${patientName}, your consultation with ${doctorName} starts in 30 min at ${appointmentTime} (${room}). Proceed to clinic now!`;
      } else if (type === "QUEUE_SUMMON") {
        finalSms = `📢 MEDIVANCE ALERT: Token #${tokenNumber || "Active"} (${patientName}) is being called right now by ${doctorName}. Please proceed directly to ${room}.`;
      } else {
        finalSms = `MEDIVANCE Update for ${patientName}: ${emailBody || "Please check your portal."}`;
      }
    }

    // Dispatch Email and SMS in parallel
    const promises: Promise<unknown>[] = [];

    let emailPromise: Promise<unknown> | null = null;
    if (email && email.includes("@")) {
      emailPromise = sendEmailWithResend({
        to: email,
        subject: finalSubject,
        patientName,
        doctorName,
        appointmentDate,
        appointmentTime,
        room,
        tokenNumber,
        type,
        message: emailBody,
      });
      promises.push(emailPromise);
    }

    let smsPromise: Promise<unknown> | null = null;
    if (phone && phone.trim()) {
      smsPromise = sendSmsWithTwilio({
        to: phone,
        message: finalSms,
      });
      promises.push(smsPromise);
    }

    const results = await Promise.allSettled(promises);

    const firstResult = results[0];
    const secondResult = results[emailPromise ? 1 : 0];

    const emailResult = emailPromise && firstResult
      ? firstResult.status === "fulfilled"
        ? (firstResult as PromiseFulfilledResult<unknown>).value
        : { ok: false, error: String((firstResult as PromiseRejectedResult).reason || "Email dispatch failed") }
      : { skipped: true };

    const smsResult = smsPromise && secondResult
      ? secondResult.status === "fulfilled"
        ? (secondResult as PromiseFulfilledResult<unknown>).value
        : { ok: false, error: String((secondResult as PromiseRejectedResult).reason || "SMS dispatch failed") }
      : { skipped: true };

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      email: emailResult,
      sms: smsResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Dispatch Error";
    console.error("[Dispatch Route Error]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
