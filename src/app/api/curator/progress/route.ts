import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCuratorSession } from "@/lib/auth";

export async function GET() {
  const session = await getCuratorSession();
  if (!session?.curatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const curatorId = session.curatorId;

  const [lessons, progress, testResults, settings] = await Promise.all([
    prisma.lesson.findMany({
      include: { topic: true, test: true },
      orderBy: [{ topic: { order: "asc" } }, { order: "asc" }],
    }),
    prisma.lessonProgress.findMany({ where: { curatorId } }),
    prisma.testResult.findMany({
      where: { curatorId },
      include: { test: true },
    }),
    prisma.settings.findFirst(),
  ]);

  const totalLessons = lessons.length;
  const completedLessons = progress.filter((p) => p.completed).length;
  const passedTests = testResults.filter((r) => r.passed).length;

  const allLessonsDone = completedLessons >= totalLessons;
  const testMode = settings?.testMode || "per_lesson";
  const passingScore = settings?.passingScore || 80;

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

  return NextResponse.json({
    totalLessons,
    completedLessons,
    passedTests,
    allLessonsDone,
    testsPassed,
    canApply,
    passingScore,
    progressPercent:
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0,
  });
}

export async function POST(req: NextRequest) {
  const session = await getCuratorSession();
  if (!session?.curatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId, watchedPercent } = await req.json();
  const completed = watchedPercent >= 80;

  const progress = await prisma.lessonProgress.upsert({
    where: {
      curatorId_lessonId: {
        curatorId: session.curatorId,
        lessonId,
      },
    },
    update: {
      watchedPercent: Math.max(watchedPercent, 0),
      completed,
      completedAt: completed ? new Date() : undefined,
    },
    create: {
      curatorId: session.curatorId,
      lessonId,
      watchedPercent,
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  return NextResponse.json(progress);
}
