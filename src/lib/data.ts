import { prisma } from "@/lib/prisma";

export async function getPublicData() {
  const [settings, topics, faqCount] = await Promise.all([
    prisma.settings.findFirst(),
    prisma.topic.findMany({
      include: {
        lessons: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    }),
    prisma.faqItem.count(),
  ]);

  return { settings, topics, faqCount };
}

export async function getLessonsWithProgress(curatorId: number) {
  const [topics, progress, settings] = await Promise.all([
    prisma.topic.findMany({
      include: {
        lessons: {
          include: { test: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    }),
    prisma.lessonProgress.findMany({ where: { curatorId } }),
    prisma.settings.findFirst(),
  ]);

  const progressMap = new Map(progress.map((p) => [p.lessonId, p]));
  const sequential = settings?.sequentialLessons ?? true;

  const allLessons = topics.flatMap((t) => t.lessons);
  let prevCompleted = true;

  const enrichedTopics = topics.map((topic) => ({
    ...topic,
    lessons: topic.lessons.map((lesson) => {
      const prog = progressMap.get(lesson.id);
      const completed = prog?.completed ?? false;
      const locked = sequential && !prevCompleted;
      if (!completed) prevCompleted = false;
      return {
        ...lesson,
        progress: prog,
        locked,
        completed,
      };
    }),
  }));

  return { topics: enrichedTopics, settings, allLessons: allLessons.length };
}
