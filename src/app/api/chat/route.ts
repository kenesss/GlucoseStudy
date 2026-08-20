import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { askChatbot } from "@/lib/chatbot";
import { sendEscalationNotification } from "@/lib/notifications";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const { message, sessionId, history, escalate, email, phone } =
    await req.json();

  const sid = sessionId || uuidv4();

  if (escalate) {
    await prisma.escalatedQuestion.create({
      data: { sessionId: sid, question: message, email, phone },
    });
    await sendEscalationNotification(message, { email, phone });
    return NextResponse.json({
      sessionId: sid,
      answer:
        "Ваш вопрос отправлен специалисту. Мы свяжемся с вами в ближайшее время.",
      escalated: true,
    });
  }

  const { answer, escalated } = await askChatbot(message, history || []);

  await prisma.chatMessage.createMany({
    data: [
      { sessionId: sid, role: "user", content: message },
      { sessionId: sid, role: "assistant", content: answer, escalated },
    ],
  });

  return NextResponse.json({ sessionId: sid, answer, escalated });
}

export async function GET() {
  const items = await prisma.faqItem.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });
  const categories = [...new Set(items.map((i) => i.category))];
  return NextResponse.json({ items, categories });
}
