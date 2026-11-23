import { NextRequest, NextResponse } from "next/server";
import { sendSmsWithTwilio, SendSmsParams } from "@/lib/sms/twilio";

export async function POST(req: NextRequest) {
  try {
    const body: SendSmsParams = await req.json();

    if (!body.to || !body.message) {
      return NextResponse.json(
        { ok: false, error: "Recipient phone ('to') and 'message' are required." },
        { status: 400 }
      );
    }

    const result = await sendSmsWithTwilio(body);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
