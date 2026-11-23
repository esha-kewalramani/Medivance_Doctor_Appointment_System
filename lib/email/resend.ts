/**
 * MEDIVANCE Resend Email Dispatch Engine
 * Sends production-grade healthcare emails using the Resend REST API.
 */

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  patientName?: string;
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  room?: string;
  tokenNumber?: number | string;
  type?: "CONFIRMATION" | "REMINDER_24H" | "REMINDER_30M" | "QUEUE_SUMMON" | "CUSTOM";
  message?: string;
  html?: string;
}

export interface EmailDispatchResult {
  ok: boolean;
  id?: string;
  simulated?: boolean;
  error?: string;
  provider: "resend";
}

/**
 * Generate a responsive, branded MEDIVANCE HTML email template
 */
export function buildMedivanceHtmlEmail(params: SendEmailParams): string {
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

  let badgeColor = "#0284c7";
  let badgeText = "Appointment Confirmed";
  let heading = "Your Consultation is Confirmed";

  if (type === "REMINDER_24H") {
    badgeColor = "#0284c7";
    badgeText = "24-Hour Reminder";
    heading = "Upcoming Appointment Tomorrow";
  } else if (type === "REMINDER_30M") {
    badgeColor = "#f59e0b";
    badgeText = "Urgent: 30-Minute Departure Alert";
    heading = "Your Consultation Starts in 30 Minutes";
  } else if (type === "QUEUE_SUMMON") {
    badgeColor = "#10b981";
    badgeText = "Now Calling Your Token";
    heading = "Please Proceed to Clinic Room";
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #030d22; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 20px auto; background-color: #071938; border: 1px solid #1e3a6a; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45); }
    .header { background: linear-gradient(135deg, #0b2554 0%, #031433 100%); padding: 32px 28px 24px; text-align: center; border-bottom: 1px solid #1e3a6a; }
    .brand-title { font-size: 26px; font-weight: 800; letter-spacing: 0.12em; color: #ffffff; margin: 0; }
    .brand-title span { color: #38bdf8; }
    .brand-tagline { font-size: 11px; text-transform: uppercase; letter-spacing: 0.24em; color: #94a3b8; margin-top: 6px; }
    .body { padding: 32px 28px; }
    .badge { display: inline-block; padding: 6px 14px; background-color: ${badgeColor}22; border: 1px solid ${badgeColor}; color: ${badgeColor}; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
    .headline { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 14px; }
    .greeting { font-size: 15px; color: #cbd5e1; line-height: 1.6; margin-bottom: 22px; }
    .details-card { background-color: #041026; border: 1px solid #1e3a6a; border-radius: 14px; padding: 20px; margin-bottom: 24px; }
    .details-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #0f274e; font-size: 14px; }
    .details-row:last-child { border-bottom: none; }
    .details-label { color: #94a3b8; }
    .details-value { font-weight: 600; color: #f1f5f9; text-align: right; }
    .highlight-value { color: #38bdf8; font-weight: 700; }
    .token-badge { background-color: #10b981; color: #022c22; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
    .message-box { background-color: #0b2246; border-left: 4px solid #38bdf8; padding: 14px 18px; border-radius: 0 10px 10px 0; font-size: 13.5px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px; white-space: pre-line; }
    .cta-container { text-align: center; margin: 28px 0 12px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%); color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 13px 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4); }
    .footer { background-color: #030e24; padding: 20px 24px; text-align: center; border-top: 1px solid #132b52; font-size: 12px; color: #64748b; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">MEDI<span>VANCE</span></h1>
      <div class="brand-tagline">AI-Powered Healthcare Ecosystem</div>
    </div>
    <div class="body">
      <div class="badge">${badgeText}</div>
      <h2 class="headline">${heading}</h2>
      <p class="greeting">Dear <strong>${patientName}</strong>,</p>

      ${
        doctorName || appointmentDate || tokenNumber
          ? `
      <div class="details-card">
        ${doctorName ? `<div class="details-row"><span class="details-label">Doctor</span><span class="details-value">${doctorName}</span></div>` : ""}
        ${appointmentDate ? `<div class="details-row"><span class="details-label">Date</span><span class="details-value">${appointmentDate}</span></div>` : ""}
        ${appointmentTime ? `<div class="details-row"><span class="details-label">Time</span><span class="details-value highlight-value">${appointmentTime}</span></div>` : ""}
        ${room ? `<div class="details-row"><span class="details-label">Clinic Room</span><span class="details-value">${room}</span></div>` : ""}
        ${tokenNumber ? `<div class="details-row"><span class="details-label">OPD Queue Token</span><span class="details-value"><span class="token-badge">Token #${tokenNumber}</span></span></div>` : ""}
      </div>
      `
          : ""
      }

      ${message ? `<div class="message-box">${message}</div>` : ""}

      <div class="cta-container">
        <a href="https://medivance.pk/patient" class="cta-button">Open Patient Portal & Digital Pass</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;"><strong>MEDIVANCE Medical System</strong> • Hyderabad, Sindh, Pakistan</p>
      <p style="margin: 0;">Powered by Technology. Driven by Care. Built for Better Healthcare.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send real email through Resend API
 */
export async function sendEmailWithResend(params: SendEmailParams): Promise<EmailDispatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "MEDIVANCE Healthcare <onboarding@resend.dev>";

  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const validRecipients = recipients.map((r) => r.trim()).filter((r) => r.includes("@"));

  if (validRecipients.length === 0) {
    return {
      ok: false,
      provider: "resend",
      error: "No valid recipient email address provided.",
    };
  }

  // If RESEND_API_KEY is not set, log and simulate cleanly
  if (!apiKey) {
    console.info(
      `[Resend Notice] RESEND_API_KEY not configured in .env.local. Simulated email to ${validRecipients.join(", ")}.`
    );
    return {
      ok: true,
      simulated: true,
      provider: "resend",
      id: `sim-email-${Date.now()}`,
    };
  }

  const html = params.html || buildMedivanceHtmlEmail(params);
  const text =
    params.message ||
    `MEDIVANCE Alert for ${params.patientName || "Patient"}: ${params.subject}. Doctor: ${params.doctorName || "Specialist"}, Time: ${params.appointmentTime || ""}. Powered by Technology. Driven by Care.`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: validRecipients,
        subject: params.subject,
        html,
        text,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Resend Error]", data);
      return {
        ok: false,
        provider: "resend",
        error: data.message || "Failed to dispatch email through Resend API.",
      };
    }

    return {
      ok: true,
      id: data.id,
      provider: "resend",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error contacting Resend API.";
    console.error("[Resend Fetch Error]", errorMsg);
    return {
      ok: false,
      provider: "resend",
      error: errorMsg,
    };
  }
}
