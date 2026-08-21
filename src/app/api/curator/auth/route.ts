import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import {
  generateOtp,
  createCuratorToken,
  getCuratorSession,
} from "@/lib/auth";
import { sendTelegramMessage, buildTelegramDeepLink } from "@/lib/telegram";
import { sendOtpEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/phone";
import { cookies } from "next/headers";

const OTP_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_MS = 60 * 1000;

async function checkRateLimit(curatorId: number): Promise<boolean> {
  const recent = await prisma.otpCode.findFirst({
    where: {
      curatorId,
      createdAt: { gt: new Date(Date.now() - RATE_LIMIT_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  return Boolean(recent);
}

async function createOtpForCurator(
  curatorId: number,
  email: string | null,
  phone: string | null
) {
  const code = generateOtp();
  await prisma.otpCode.create({
    data: {
      code,
      email,
      phone,
      curatorId,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, email, phone: rawPhone, code } = body;

  if (action === "send") {
    if (!email && !rawPhone) {
      return NextResponse.json(
        { error: "Телефон немесе email көрсетіңіз" },
        { status: 400 }
      );
    }

    const phone = rawPhone ? normalizePhone(rawPhone) : null;

    let curator = await prisma.curator.findFirst({
      where: phone ? { phone } : { email: email! },
    });

    if (!curator) {
      curator = await prisma.curator.create({
        data: { phone, email: email || null },
      });
    } else if (phone && curator.phone !== phone) {
      curator = await prisma.curator.update({
        where: { id: curator.id },
        data: { phone },
      });
    }

    if (await checkRateLimit(curator.id)) {
      return NextResponse.json(
        { error: "Кодты қайта сұрау үшін 60 секунд күтіңіз" },
        { status: 429 }
      );
    }

    const otpCode = await createOtpForCurator(
      curator.id,
      email || null,
      phone
    );

    const response: Record<string, unknown> = { success: true };

    if (phone) {
      if (curator.telegramChatId) {
        const sent = await sendTelegramMessage(
          curator.telegramChatId,
          `🔐 GlucoseOnline кіру кодыңыз:\n\n${otpCode}\n\nКод 5 минут жарамды.`
        );
        if (!sent) {
          return NextResponse.json(
            { error: "Telegram-ға код жіберілмеді. Кейінірек көріңіз." },
            { status: 500 }
          );
        }
        response.method = "telegram";
        response.message = "Код Telegram-ға жіберілді";
      } else {
        const linkCode = nanoid(8);
        await prisma.curator.update({
          where: { id: curator.id },
          data: { telegramLinkCode: linkCode },
        });
        response.method = "link_required";
        response.telegramLinkUrl = buildTelegramDeepLink(linkCode);
        response.message =
          "Алдымен Telegram-ды байлаңыз — код сол жаққа жіберіледі";
        await prisma.otpCode.updateMany({
          where: { curatorId: curator.id, code: otpCode, used: false },
          data: { used: true },
        });
      }
    } else if (email) {
      const sent = await sendOtpEmail(email, otpCode);
      if (sent) {
        response.method = "email";
        response.message = "Код email-ге жіберілді";
      } else if (process.env.NODE_ENV === "development") {
        response.method = "dev";
        response.devOtp = otpCode;
        response.message = "SMTP бапталмаған — код төменде көрсетілген (dev)";
      } else {
        return NextResponse.json(
          {
            error:
              "Email жіберу қолжетімсіз. Telegram арқылы телефонмен кіріңіз.",
          },
          { status: 503 }
        );
      }
    }

    if (
      process.env.NODE_ENV === "development" &&
      response.method === "telegram"
    ) {
      response.devOtp = otpCode;
    }

    return NextResponse.json(response);
  }

  if (action === "verify") {
    if (!code || (!email && !rawPhone)) {
      return NextResponse.json({ error: "Деректер қате" }, { status: 400 });
    }

    const phone = rawPhone ? normalizePhone(rawPhone) : null;

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        code,
        used: false,
        expiresAt: { gt: new Date() },
        ...(phone ? { phone } : { email }),
      },
      include: { curator: true },
    });

    if (!otpRecord || !otpRecord.curator) {
      return NextResponse.json(
        { error: "Қате немесе мерзімі өткен код" },
        { status: 400 }
      );
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const token = await createCuratorToken(otpRecord.curator.id);
    const cookieStore = await cookies();
    cookieStore.set("curator_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      curatorId: otpRecord.curator.id,
      telegramLinked: Boolean(otpRecord.curator.telegramChatId),
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET() {
  const session = await getCuratorSession();
  if (!session?.curatorId) {
    return NextResponse.json({ curatorId: null });
  }

  const curator = await prisma.curator.findUnique({
    where: { id: session.curatorId },
    select: {
      id: true,
      telegramChatId: true,
    },
  });

  return NextResponse.json({
    curatorId: curator?.id ?? null,
    telegramLinked: Boolean(curator?.telegramChatId),
  });
}
