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
    parts.push("\n=== База знаний ===");
    for (const kb of knowledgeBase) {
      parts.push(`${kb.title}:\n${kb.content}`);
    }
  }

  if (lessons.length > 0) {
    parts.push("\n=== Материалы уроков ===");
    for (const lesson of lessons) {
      parts.push(
        `[${lesson.topic.title}] ${lesson.title}:\n${lesson.description}`
      );
    }
  }

  return parts.join("\n\n");
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
        "К сожалению, я не нашёл ответ на ваш вопрос. Нажмите «Задать вопрос человеку», и наш специалист свяжется с вами.",
      escalated: true,
    };
  }

  const systemPrompt = `Ты — помощник для кураторов платформы GlucoseOnline. Отвечай на вопросы о работе с админ-панелью admin.glucoseonline.kz на основе предоставленной базы знаний.

Правила:
- Отвечай кратко и по делу на русском языке
- Используй только информацию из базы знаний
- Если ответа нет в базе знаний, скажи: "Я не нашёл ответ на этот вопрос. Рекомендую задать вопрос специалисту."
- Не выдумывай информацию

База знаний:
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
        : "Не удалось получить ответ.";

    const escalated = answer.includes("не нашёл ответ") || answer.includes("задать вопрос специалисту");

    return { answer, escalated };
  } catch {
    return {
      answer:
        "Произошла ошибка при обработке вопроса. Попробуйте задать вопрос специалисту.",
      escalated: true,
    };
  }
}
