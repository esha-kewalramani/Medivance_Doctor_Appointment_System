/**
 * MEDIVANCE WhatsApp Dispatch Engine
 * 100% Direct One-Click WhatsApp Dispatch (wa.me) - Requires zero external API keys.
 */

export interface SendWhatsAppParams {
  to: string;
  message?: string;
  patientName?: string;
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  room?: string;
  tokenNumber?: number | string;
  type?: "CONFIRMATION" | "REMINDER_24H" | "REMINDER_30M" | "QUEUE_SUMMON" | "CUSTOM";
}

export interface WhatsAppDispatchResult {
  ok: boolean;
  id?: string;
  whatsappUrl?: string;
  formattedTo?: string;
  provider: "direct";
}

/**
 * Format any regional Pakistani or international phone number for WhatsApp
 * Strips '+', spaces, and turns 03XXXXXXXXX into 923XXXXXXXXX
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[\s\-\(\)\.\+]/g, "").trim();

  // If local Pakistani 03001234567 -> 923001234567
  if (/^03\d{9}$/.test(cleaned)) {
    return "92" + cleaned.slice(1);
  }

  // If Pakistani without 0: 3001234567 -> 923001234567
  if (/^3\d{9}$/.test(cleaned)) {
    return "92" + cleaned;
  }

  // Default international format without leading plus
  return cleaned;
}

/**
 * Generates an instant, pre-filled WhatsApp direct chat link (wa.me)
 * Works immediately on all devices without requiring API keys or approvals.
 */
export function getWhatsAppDirectUrl(phone: string, text: string): string {
  const number = formatWhatsAppNumber(phone);
  return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(text)}`;
}

/**
 * Formats a clean, professional medical WhatsApp message with visual hierarchy
 */
export function buildWhatsAppMessage(params: SendWhatsAppParams): string {
  const {
    patientName = "Valued Patient",
    doctorName,
    appointmentDate,
    appointmentTime,
    room = "Room 102 - OPD Heart Wing",
    tokenNumber,
    type = "CONFIRMATION",
    message,
  } = params;

  if (message) return message;

  if (type === "CONFIRMATION") {
    return `🏥 *MEDIVANCE HEALTHCARE SYSTEM*\n*Booking Confirmation*\n\nDear *${patientName}*,\nYour consultation has been confirmed:\n\n👨‍⚕️ *Doctor:* ${doctorName || "Specialist"}\n📅 *Date:* ${appointmentDate}\n⏰ *Time:* ${appointmentTime}\n📍 *Clinic:* ${room}\n${tokenNumber ? `🎫 *Token Number:* #${tokenNumber}\n` : ""}\n⚡ Fast-track check-in and live turnstile passes are active in your portal: https://medivance.pk/patient\n\n_Powered by Technology. Driven by Care._`;
  }

  if (type === "REMINDER_24H") {
    return `🏥 *MEDIVANCE 24-HOUR REMINDER*\n\nDear *${patientName}*,\nThis is a friendly reminder for your appointment tomorrow:\n\n👨‍⚕️ *Doctor:* ${doctorName}\n📅 *Date:* ${appointmentDate}\n⏰ *Time:* ${appointmentTime}\n📍 *Room:* ${room}\n\nPlease check in 10 minutes prior to your scheduled time.`;
  }

  if (type === "REMINDER_30M") {
    return `🚨 *MEDIVANCE URGENT 30-MIN ALERT*\n\nDear *${patientName}*,\nYour consultation with *${doctorName}* begins in *30 minutes* at *${appointmentTime}* (${room}).\n\nPlease proceed directly to the OPD clinic room now!`;
  }

  if (type === "QUEUE_SUMMON") {
    return `📢 *MEDIVANCE LIVE QUEUE ALERT*\n\n*Token #${tokenNumber || "Active"}* (${patientName}), you are being called right now by *${doctorName}*.\n\n📍 Please enter *${room}* immediately.`;
  }

  return `🏥 *MEDIVANCE Notification for ${patientName}*:\n\n${message || "Your appointment has been updated. Please check your patient portal."}`;
}

/**
 * Generates direct one-click WhatsApp dispatch without any external API keys
 */
export async function sendWhatsApp(params: SendWhatsAppParams): Promise<WhatsAppDispatchResult> {
  const formattedTo = formatWhatsAppNumber(params.to);
  const text = buildWhatsAppMessage(params);
  const directUrl = getWhatsAppDirectUrl(params.to, text);

  return {
    ok: true,
    provider: "direct",
    id: `wa-direct-${Date.now()}`,
    formattedTo,
    whatsappUrl: directUrl,
  };
}
