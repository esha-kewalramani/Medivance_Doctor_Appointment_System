import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "SMS dispatch has been deprecated and disabled across MEDIVANCE. All real communications operate via verified Email (Resend) and 1-Click WhatsApp.",
    },
    { status: 410 }
  );
}
