import { NextRequest, NextResponse } from "next/server";
import { sendWhatsApp, SendWhatsAppParams } from "@/lib/whatsapp/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body: SendWhatsAppParams = await req.json();

    if (!body.to) {
      return NextResponse.json(
        { ok: false, error: "Recipient phone number ('to') is required." },
        { status: 400 }
      );
    }

    const result = await sendWhatsApp(body);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal WhatsApp API Error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
