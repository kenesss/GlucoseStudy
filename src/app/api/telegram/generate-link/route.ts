import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getCuratorSession } from "@/lib/auth";
import { buildTelegramDeepLink } from "@/lib/telegram";
import { normalizePhone } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await getCuratorSession();

  let curator = null;

  if (session?.curatorId) {
    curator = await prisma.curator.findUnique({
      where: { id: session.curatorId },
    });
  } else if (body.phone) {
    const phone = normalizePhone(body.phone);
    curator = await prisma.curator.findUnique({ where: { phone } });
    if (!curator) {
      curator = await prisma.curator.create({ data: { phone } });
    }
  }

  if (!curator) {
    return NextResponse.json(
      { error: "Укажите номер телефона" },
      { status: 400 }
    );
  }

  if (curator.telegramChatId) {
    return NextResponse.json({
      linked: true,
      url: null,
    });
  }

  const code = nanoid(8);

  await prisma.curator.update({
    where: { id: curator.id },
    data: { telegramLinkCode: code },
  });

  return NextResponse.json({
    linked: false,
    url: buildTelegramDeepLink(code),
    curatorId: curator.id,
  });
}
