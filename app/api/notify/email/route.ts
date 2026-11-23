import { NextRequest, NextResponse } from "next/server";
import { sendEmailWithResend, SendEmailParams } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  try {
    const body: SendEmailParams = await req.json();

    if (!body.to || !body.subject) {
      return NextResponse.json(
        { ok: false, error: "Recipient email ('to') and 'subject' are required." },
        { status: 400 }
      );
    }

    const result = await sendEmailWithResend(body);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
