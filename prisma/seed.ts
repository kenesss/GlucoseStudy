import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      sequentialLessons: true,
      testMode: "per_lesson",
      passingScore: 80,
      welcomeTitle: "GlucoseOnline кураторларын оқытуға қош келдіңіз",
      welcomeText:
        "Бұл платформа GlucoseOnline админ-панелімен жұмысты меңгеруге көмектеседі. Бейнесабақтарды өтіп, тест тапсырып, қолжетімділікке өтінім жіберіңіз.",
      applicationConfirmMsg:
        "Өтінім жіберілді! admin.glucoseonline.kz қолжетімділігі 24 сағат ішінде беріледі.",
    },
  });

  const topic1 = await prisma.topic.create({
    data: {
      title: "Начало работы",
      order: 1,
      lessons: {
        create: [
          {
            title: "Вход в админ-панель",
            description:
              "В этом уроке вы узнаете, как войти в admin.glucoseonline.kz и ориентироваться в интерфейсе.",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            videoType: "youtube",
            checklist: JSON.stringify([
              "Запомните адрес admin.glucoseonline.kz",
              "Используйте email и пароль, выданные администратором",
              "При проблемах со входом обратитесь к куратору потока",
            ]),
            order: 1,
          },
          {
            title: "Обзор главной страницы",
            description:
              "Знакомство с основными разделами админ-панели: потоки, задания, ученики.",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            videoType: "youtube",
            checklist: JSON.stringify([
              "Главная страница показывает активные потоки",
              "Боковое меню содержит все основные разделы",
              "Уведомления отображаются в правом верхнем углу",
            ]),
            order: 2,
          },
        ],
      },
    },
    include: { lessons: true },
  });

  const topic2 = await prisma.topic.create({
    data: {
      title: "Работа с заданиями",
      order: 2,
      lessons: {
        create: [
          {
            title: "Создание задания",
            description:
              "Пошаговая инструкция по созданию нового задания для учеников.",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            videoType: "youtube",
            checklist: JSON.stringify([
              "Выберите поток перед созданием задания",
              "Укажите дедлайн и максимальный балл",
              "Добавьте описание и прикрепите файлы при необходимости",
            ]),
            order: 1,
          },
          {
            title: "Проверка работ ученика",
            description:
              "Как просматривать сданные работы, выставлять оценки и оставлять комментарии.",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            videoType: "youtube",
            checklist: JSON.stringify([
              "Откройте раздел «Работы» в нужном потоке",
              "Проверяйте работы в порядке поступления",
              "Оставляйте развёрнутый комментарий при снижении балла",
            ]),
            order: 2,
          },
        ],
      },
    },
    include: { lessons: true },
  });

  const allLessons = [...topic1.lessons, ...topic2.lessons];

  for (const lesson of allLessons) {
    await prisma.test.create({
      data: {
        title: `Тест: ${lesson.title}`,
        lessonId: lesson.id,
        questions: {
          create: [
            {
              text: `Что является главной темой урока «${lesson.title}»?`,
              type: "single",
              options: JSON.stringify([
                { text: "Работа с админ-панелью GlucoseOnline", isCorrect: true },
                { text: "Настройка личного профиля", isCorrect: false },
                { text: "Удаление потока", isCorrect: false },
                { text: "Смена пароля", isCorrect: false },
              ]),
              order: 1,
            },
            {
              text: "Какие пункты из чек-листа важно запомнить?",
              type: "multiple",
              options: JSON.stringify([
                { text: "Все пункты из чек-листа урока", isCorrect: true },
                { text: "Только первый пункт", isCorrect: false },
                { text: "Ничего запоминать не нужно", isCorrect: false },
              ]),
              order: 2,
            },
          ],
        },
      },
    });
  }

  await prisma.test.create({
    data: {
      title: "Финальный тест",
      isFinal: true,
      questions: {
        create: [
          {
            text: "Какой адрес у админ-панели GlucoseOnline?",
            type: "single",
            options: JSON.stringify([
              { text: "admin.glucoseonline.kz", isCorrect: true },
              { text: "glucoseonline.kz/admin", isCorrect: false },
              { text: "app.glucoseonline.com", isCorrect: false },
            ]),
            order: 1,
          },
          {
            text: "Что нужно сделать после создания задания?",
            type: "single",
            options: JSON.stringify([
              { text: "Убедиться, что задание видно ученикам потока", isCorrect: true },
              { text: "Удалить задание", isCorrect: false },
              { text: "Сменить пароль", isCorrect: false },
            ]),
            order: 2,
          },
          {
            text: "При проверке работ нужно:",
            type: "multiple",
            options: JSON.stringify([
              { text: "Выставить балл", isCorrect: true },
              { text: "Оставить комментарий при снижении балла", isCorrect: true },
              { text: "Игнорировать просроченные работы", isCorrect: false },
            ]),
            order: 3,
          },
        ],
      },
    },
  });

  await prisma.faqItem.createMany({
    data: [
      {
        question: "Как получить доступ к admin.glucoseonline.kz?",
        answer:
          "Пройдите все уроки на этой платформе, сдайте тест с проходным баллом и заполните форму заявки. Доступ будет выдан в течение 24 часов.",
        category: "Доступ",
        order: 1,
      },
      {
        question: "Что делать, если забыл пароль от админки?",
        answer:
          "Напишите ответственному куратору или используйте функцию «Забыли пароль» на странице входа admin.glucoseonline.kz.",
        category: "Доступ",
        order: 2,
      },
      {
        question: "Можно ли пропустить урок?",
        answer:
          "Если включён последовательный режим, следующий урок открывается только после просмотра предыдущего. Досмотрите видео до конца (80%+), чтобы урок засчитался.",
        category: "Обучение",
        order: 3,
      },
      {
        question: "Сколько попыток на тест?",
        answer:
          "Количество попыток не ограничено. Вы можете пересдать тест, если не набрали проходной балл.",
        category: "Тесты",
        order: 4,
      },
    ],
  });

  await prisma.knowledgeBase.createMany({
    data: [
      {
        title: "Общая информация о GlucoseOnline",
        content:
          "GlucoseOnline — образовательная платформа. Кураторы управляют потоками, заданиями и проверкой работ учеников через admin.glucoseonline.kz.",
      },
      {
        title: "Роли куратора",
        content:
          "Куратор создаёт задания, проверяет работы, следит за прогрессом учеников и отвечает на их вопросы в рамках своего потока.",
      },
    ],
  });

  console.log("Seed completed successfully!");
  console.log(`Admin login: ${process.env.ADMIN_USERNAME || "admin"}`);
  console.log(`Admin password: ${process.env.ADMIN_PASSWORD || "change-me-in-production"}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
