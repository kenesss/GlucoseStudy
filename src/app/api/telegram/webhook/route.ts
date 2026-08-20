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
          "👋 Добро пожаловать! Для привязки аккаунта перейдите по ссылке с сайта обучения и нажмите Start."
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
          "✅ Telegram успешно привязан. Теперь коды для входа будут приходить сюда.\n\nВернитесь на сайт и нажмите «Получить код»."
        );
      } else {
        await sendTelegramMessage(
          chatId,
          "❌ Код не найден или уже использован. Запросите новую ссылку на сайте."
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
