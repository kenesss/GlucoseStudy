import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCuratorSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getCuratorSession();

  const lesson = await prisma.lesson.findUnique({
    where: { id: Number(id) },
    include: { topic: true, test: true },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let progress = null;
  if (session?.curatorId) {
    progress = await prisma.lessonProgress.findUnique({
      where: {
        curatorId_lessonId: {
          curatorId: session.curatorId,
          lessonId: lesson.id,
        },
      },
    });
  }

  return NextResponse.json({ ...lesson, progress });
}
