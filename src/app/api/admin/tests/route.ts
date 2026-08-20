import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tests = await prisma.test.findMany({
    include: {
      questions: { orderBy: { order: "asc" } },
      lesson: true,
      _count: { select: { results: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(tests);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.type === "test") {
    const test = await prisma.test.create({
      data: {
        title: body.title,
        lessonId: body.lessonId || null,
        isFinal: body.isFinal || false,
      },
    });
    return NextResponse.json(test);
  }

  if (body.type === "question" || body.entity === "question") {
    const question = await prisma.question.create({
      data: {
        testId: body.testId,
        text: body.text,
        type: body.questionType || "single",
        options: JSON.stringify(body.options || []),
        correctAnswer: body.correctAnswer || "",
        order: body.order || 0,
      },
    });
    return NextResponse.json(question);
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.type === "test") {
    const test = await prisma.test.update({
      where: { id: body.id },
      data: { title: body.title, lessonId: body.lessonId, isFinal: body.isFinal },
    });
    return NextResponse.json(test);
  }

  if (body.type === "question" || body.entity === "question") {
    const question = await prisma.question.update({
      where: { id: body.id },
      data: {
        text: body.text,
        type: body.questionType,
        options: JSON.stringify(body.options || []),
        correctAnswer: body.correctAnswer || "",
        order: body.order,
      },
    });
    return NextResponse.json(question);
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await req.json();

  if (type === "test") {
    await prisma.test.delete({ where: { id } });
  } else if (type === "question") {
    await prisma.question.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
