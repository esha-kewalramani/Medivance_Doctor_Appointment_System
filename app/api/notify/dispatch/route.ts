import { NextRequest, NextResponse } from "next/server";
import { sendEmailWithResend } from "@/lib/email/resend";

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
  emailSubject?: string;
  emailBody?: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload: DispatchPayload = await req.json();

    const {
      patientName,
      email,
      doctorName,
      appointmentDate,
      appointmentTime,
      room = "Room 102 - OPD Heart Wing",
      tokenNumber,
      type = "CONFIRMATION",
      emailSubject,
      emailBody,
    } = payload;

    // Default subject generator based on notification type
    let finalSubject = emailSubject;

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

    let emailResult: any = { skipped: true };

    if (email && email.includes("@")) {
      emailResult = await sendEmailWithResend({
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
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      email: emailResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Dispatch Error";
    console.error("[Dispatch Route Error]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
