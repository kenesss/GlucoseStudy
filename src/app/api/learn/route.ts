import { getLessonsWithProgress } from "@/lib/data";
import { getCuratorSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCuratorSession();
  const curatorId = session?.curatorId;

  if (curatorId) {
    const data = await getLessonsWithProgress(curatorId);
    return NextResponse.json(data);
  }

  const topics = await prisma.topic.findMany({
    include: {
      lessons: {
        include: { test: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  const enriched = topics.map((topic) => ({
    ...topic,
    lessons: topic.lessons.map((lesson) => ({
      ...lesson,
      locked: false,
      completed: false,
      progress: null,
    })),
  }));

  return NextResponse.json({ topics: enriched });
}
