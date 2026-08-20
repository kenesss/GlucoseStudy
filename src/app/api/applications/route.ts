import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCuratorSession } from "@/lib/auth";
import { notifyApplication } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getCuratorSession();
  if (!session?.curatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { firstName, lastName, phone, email, streamName } = body;

  if (!firstName || !lastName || !phone || !email || !streamName) {
    return NextResponse.json(
      { error: "Заполните все обязательные поля" },
      { status: 400 }
    );
  }

  const [lessons, progress, testResults, settings] = await Promise.all([
    prisma.lesson.findMany({ include: { test: true } }),
    prisma.lessonProgress.findMany({ where: { curatorId: session.curatorId } }),
    prisma.testResult.findMany({ where: { curatorId: session.curatorId } }),
    prisma.settings.findFirst(),
  ]);

  const totalLessons = lessons.length;
  const completedLessons = progress.filter((p) => p.completed).length;
  const allLessonsDone = completedLessons >= totalLessons;
  const testMode = settings?.testMode || "per_lesson";

  let testsPassed = false;
  if (testMode === "final") {
    const finalTest = await prisma.test.findFirst({ where: { isFinal: true } });
    testsPassed = finalTest
      ? testResults.some((r) => r.testId === finalTest.id && r.passed)
      : true;
  } else {
    const lessonTests = lessons.filter((l) => l.test).map((l) => l.test!.id);
    testsPassed =
      lessonTests.length === 0 ||
      lessonTests.every((testId) =>
        testResults.some((r) => r.testId === testId && r.passed)
      );
  }

  const canApply = allLessonsDone && testsPassed;

  if (!canApply) {
    return NextResponse.json(
      { error: "Сначала завершите обучение и тест" },
      { status: 403 }
    );
  }

  const latestResult = await prisma.testResult.findFirst({
    where: { curatorId: session.curatorId, passed: true },
    orderBy: { createdAt: "desc" },
  });

  const application = await prisma.application.create({
    data: {
      curatorId: session.curatorId,
      firstName,
      lastName,
      phone,
      email,
      streamName,
      testScore: latestResult?.score,
    },
  });

  await prisma.curator.update({
    where: { id: session.curatorId },
    data: { firstName, lastName, email, phone },
  });

  await notifyApplication({
    firstName,
    lastName,
    phone,
    email,
    streamName,
    testScore: latestResult?.score,
  });

  return NextResponse.json({
    id: application.id,
    confirmMessage: settings?.applicationConfirmMsg,
  });
}

export async function GET() {
  const applications = await prisma.application.findMany({
    include: { curator: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(applications);
}
