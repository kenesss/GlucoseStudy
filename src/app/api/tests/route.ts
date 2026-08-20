import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCuratorSession } from "@/lib/auth";
import { parseOptions } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const testId = Number(req.nextUrl.searchParams.get("testId"));
  if (!testId) {
    return NextResponse.json({ error: "testId required" }, { status: 400 });
  }

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      questions: { orderBy: { order: "asc" } },
      lesson: { include: { topic: true } },
    },
  });

  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const safeQuestions = test.questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    options: parseOptions(q.options).map((o) => ({ text: o.text })),
    order: q.order,
  }));

  return NextResponse.json({
    ...test,
    questions: safeQuestions,
  });
}

export async function POST(req: NextRequest) {
  const session = await getCuratorSession();
  if (!session?.curatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { testId, answers } = await req.json();
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { questions: true },
  });

  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const settings = await prisma.settings.findFirst();
  const passingScore = settings?.passingScore || 80;

  let correct = 0;
  const total = test.questions.length;

  for (const question of test.questions) {
    const userAnswer = answers[question.id];
    if (!userAnswer) continue;

    if (question.type === "text") {
      if (
        userAnswer.toLowerCase().trim() ===
        question.correctAnswer.toLowerCase().trim()
      ) {
        correct++;
      }
    } else if (question.type === "single") {
      const options = parseOptions(question.options);
      const correctIdx = options.findIndex((o) => o.isCorrect);
      if (Number(userAnswer) === correctIdx) correct++;
    } else if (question.type === "multiple") {
      const options = parseOptions(question.options);
      const correctIndices = options
        .map((o, i) => (o.isCorrect ? i : -1))
        .filter((i) => i >= 0)
        .sort();
      const userIndices = (userAnswer as number[]).sort();
      if (JSON.stringify(correctIndices) === JSON.stringify(userIndices)) {
        correct++;
      }
    }
  }

  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = score >= passingScore;

  const result = await prisma.testResult.create({
    data: {
      curatorId: session.curatorId,
      testId,
      score,
      passed,
      answers: JSON.stringify(answers),
    },
  });

  return NextResponse.json({ score, passed, resultId: result.id, passingScore });
}
