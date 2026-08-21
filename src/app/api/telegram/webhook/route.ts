import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text: string = message.text || "";

    if (text.startsWith("/start")) {
      const code = text.split(" ")[1]?.trim();

      if (!code) {
        await sendTelegramMessage(
          chatId,
          "👋 Қош келдіңіз! Аккаунтты байлау үшін оқыту сайтындағы сілтеме арқылы өтіп, Start басыңыз."
        );
        return NextResponse.json({ ok: true });
      }

      const curator = await prisma.curator.findFirst({
        where: { telegramLinkCode: code },
      });

      if (curator) {
        await prisma.curator.update({
          where: { id: curator.id },
          data: {
            telegramChatId: String(chatId),
            telegramLinkCode: null,
          },
        });

        await sendTelegramMessage(
          chatId,
          "✅ Telegram сәтті байланды. Енді кіру кодтары осында келеді.\n\nСайтқа оралып, «Код алу» батырмасын басыңыз."
        );
      } else {
        await sendTelegramMessage(
          chatId,
          "❌ Код табылмады немесе қолданылған. Сайттан жаңа сілтеме сұраңыз."
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
