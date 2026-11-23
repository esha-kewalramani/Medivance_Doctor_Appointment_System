/**
 * MEDIVANCE Twilio SMS Dispatch Engine
 * Sends production-grade healthcare SMS messages using the Twilio REST API.
 */

export interface SendSmsParams {
  to: string;
  message: string;
}

export interface SmsDispatchResult {
  ok: boolean;
  id?: string;
  simulated?: boolean;
  error?: string;
  formattedTo?: string;
  provider: "twilio";
}

/**
 * Format any regional or local phone number to E.164 international standard
 * e.g., 0300 1234567 -> +923001234567
 * e.g., (555) 123-4567 -> +15551234567
 */
export function formatE164(phone: string): string {
  if (!phone) return "";
  // Strip all whitespace, dashes, dots, and brackets
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "").trim();

  // Handle local Pakistani cell format 03XXXXXXXXX -> +923XXXXXXXXX
  if (/^03\d{9}$/.test(cleaned)) {
    return "+92" + cleaned.slice(1);
  }

  // Handle Pakistani cell without leading 0: 3XXXXXXXXX -> +923XXXXXXXXX
  if (/^3\d{9}$/.test(cleaned)) {
    return "+92" + cleaned;
  }

  // Handle standard US 10-digit without country code: 10 digits
  if (/^\d{10}$/.test(cleaned)) {
    return "+1" + cleaned;
  }

  // Prepend '+' if missing
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}

/**
 * Send real SMS via Twilio REST API
 */
export async function sendSmsWithTwilio(params: SendSmsParams): Promise<SmsDispatchResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  const formattedTo = formatE164(params.to);

  if (!formattedTo || formattedTo.length < 8) {
    return {
      ok: false,
      provider: "twilio",
      error: `Invalid phone number format: "${params.to}". Must be standard telephone or international format.`,
    };
  }

  // If Twilio credentials are not set, log and simulate cleanly
  if (!accountSid || !authToken || !fromNumber) {
    console.info(
      `[Twilio Notice] Twilio credentials not configured in .env.local. Simulated SMS to ${formattedTo}: "${params.message.slice(0, 50)}..."`
    );
    return {
      ok: true,
      simulated: true,
      provider: "twilio",
      id: `sim-sms-${Date.now()}`,
      formattedTo,
    };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const bodyParams = new URLSearchParams({
      From: fromNumber,
      To: formattedTo,
      Body: params.message,
    });

    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Twilio Error]", data);
      return {
        ok: false,
        provider: "twilio",
        error: data.message || `Twilio error code ${data.code}`,
        formattedTo,
      };
    }

    return {
      ok: true,
      id: data.sid,
      provider: "twilio",
      formattedTo,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error contacting Twilio API.";
    console.error("[Twilio Fetch Error]", errorMsg);
    return {
      ok: false,
      provider: "twilio",
      error: errorMsg,
      formattedTo,
    };
  }
}
