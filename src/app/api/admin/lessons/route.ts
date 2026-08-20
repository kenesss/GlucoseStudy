import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topics = await prisma.topic.findMany({
    include: {
      lessons: {
        include: { test: { include: { _count: { select: { questions: true } } } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(topics);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type } = body;

  if (type === "topic") {
    const topic = await prisma.topic.create({
      data: { title: body.title, order: body.order || 0 },
    });
    return NextResponse.json(topic);
  }

  if (type === "lesson") {
    const lesson = await prisma.lesson.create({
      data: {
        title: body.title,
        description: body.description || "",
        videoUrl: body.videoUrl,
        videoType: body.videoType || "youtube",
        checklist: JSON.stringify(body.checklist || []),
        order: body.order || 0,
        topicId: body.topicId,
      },
    });
    return NextResponse.json(lesson);
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, id } = body;

  if (type === "topic") {
    const topic = await prisma.topic.update({
      where: { id },
      data: { title: body.title, order: body.order },
    });
    return NextResponse.json(topic);
  }

  if (type === "lesson") {
    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        videoUrl: body.videoUrl,
        videoType: body.videoType,
        checklist: JSON.stringify(body.checklist || []),
        order: body.order,
        topicId: body.topicId,
      },
    });
    return NextResponse.json(lesson);
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await req.json();

  if (type === "topic") {
    await prisma.topic.delete({ where: { id } });
  } else if (type === "lesson") {
    await prisma.lesson.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
