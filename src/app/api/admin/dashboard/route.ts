import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [applications, settings, knowledge, testResults, escalated] =
    await Promise.all([
      prisma.application.findMany({
        include: { curator: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.settings.findFirst(),
      prisma.knowledgeBase.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.testResult.findMany({
        include: { curator: true, test: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.escalatedQuestion.findMany({
        where: { resolved: false },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return NextResponse.json({
    applications: applications.map((app) => ({
      ...app,
      curator: app.curator
        ? {
            email: app.curator.email,
            phone: app.curator.phone,
            telegramLinked: Boolean(app.curator.telegramChatId),
          }
        : null,
    })),
    settings,
    knowledge,
    testResults,
    escalated,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.type === "settings") {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: body.data,
      create: { id: 1, ...body.data },
    });
    return NextResponse.json(settings);
  }

  if (body.type === "application_status") {
    const app = await prisma.application.update({
      where: { id: body.id },
      data: { status: body.status },
    });
    return NextResponse.json(app);
  }

  if (body.type === "knowledge") {
    if (body.id) {
      const kb = await prisma.knowledgeBase.update({
        where: { id: body.id },
        data: { title: body.title, content: body.content },
      });
      return NextResponse.json(kb);
    }
    const kb = await prisma.knowledgeBase.create({
      data: { title: body.title, content: body.content },
    });
    return NextResponse.json(kb);
  }

  if (body.type === "resolve_escalation") {
    await prisma.escalatedQuestion.update({
      where: { id: body.id },
      data: { resolved: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await req.json();

  if (type === "knowledge") {
    await prisma.knowledgeBase.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
