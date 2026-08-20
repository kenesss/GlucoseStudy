import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }

  const curator = await prisma.curator.findUnique({
    where: { phone: normalizePhone(phone) },
    select: { telegramChatId: true },
  });

  return NextResponse.json({
    linked: Boolean(curator?.telegramChatId),
  });
}
