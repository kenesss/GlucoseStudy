import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

async function buildKnowledgeContext(): Promise<string> {
  const [faqItems, knowledgeBase, lessons] = await Promise.all([
    prisma.faqItem.findMany({ orderBy: { order: "asc" } }),
    prisma.knowledgeBase.findMany(),
    prisma.lesson.findMany({
      include: { topic: true },
      orderBy: [{ topic: { order: "asc" } }, { order: "asc" }],
    }),
  ]);

  const parts: string[] = [];

  if (faqItems.length > 0) {
    parts.push("=== FAQ ===");
    for (const item of faqItems) {
      parts.push(`Q: ${item.question}\nA: ${item.answer}`);
    }
  }

  if (knowledgeBase.length > 0) {
    parts.push("\n=== Білім базасы ===");
    for (const kb of knowledgeBase) {
      parts.push(`${kb.title}:\n${kb.content}`);
    }
  }

  if (lessons.length > 0) {
    parts.push("\n=== Сабақ материалдары ===");
    for (const lesson of lessons) {
      parts.push(
        `[${lesson.topic.title}] ${lesson.title}:\n${lesson.description}`
      );
    }
  }

  return parts.join("\n\n");
}

function isEscalationAnswer(answer: string): boolean {
  const lower = answer.toLowerCase();
  return (
    lower.includes("жауап таппадым") ||
    lower.includes("маманға сұрақ") ||
    lower.includes("не нашёл ответ") ||
    lower.includes("задать вопрос специалисту")
  );
}

export async function askChatbot(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<{ answer: string; escalated: boolean }> {
  const context = await buildKnowledgeContext();

  if (!anthropic) {
    const lowerMsg = message.toLowerCase();
    const faqItems = await prisma.faqItem.findMany();
    const match = faqItems.find(
      (item) =>
        item.question.toLowerCase().includes(lowerMsg) ||
        lowerMsg.includes(item.question.toLowerCase().slice(0, 20))
    );
    if (match) {
      return { answer: match.answer, escalated: false };
    }
    return {
      answer:
        "Өкінішке орай, сұрағыңызға жауап таппадым. «Адамға сұрақ қою» батырмасын басыңыз — маман сізбен байланысады.",
      escalated: true,
    };
  }

  const systemPrompt = `Сен — GlucoseOnline платформасының кураторларына арналған көмекшісің. admin.glucoseonline.kz админ-панелімен жұмыс туралы сұрақтарға берілген білім базасы негізінде жауап бер.

Ережелер:
- Қазақ тілінде қысқа әрі нақты жауап бер
- Тек білім базасындағы ақпаратты пайдалан
- Білім базасында жауап жоқ болса, былай айт: "Бұл сұраққа жауап таппадым. Маманға сұрақ қоюды ұсынамын."
- Ақпаратты ойдан шығарма

Білім базасы:
${context}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...history.map((h) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user", content: message },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const answer =
      textBlock && "text" in textBlock
        ? textBlock.text
        : "Жауап алу мүмкін болмады.";

    return { answer, escalated: isEscalationAnswer(answer) };
  } catch {
    return {
      answer:
        "Сұрақты өңдеу кезінде қате орын алды. Маманға сұрақ қойып көріңіз.",
      escalated: true,
    };
  }
}
