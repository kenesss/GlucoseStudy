"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PublicHeader, Button, Card, ProgressBar } from "@/components/ui";
import { CuratorAuth } from "@/components/CuratorAuth";
import { BookOpen, CheckCircle, ArrowRight } from "lucide-react";

interface Progress {
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  canApply: boolean;
  testsPassed: boolean;
}

export default function HomePage() {
  const [curatorId, setCuratorId] = useState<number | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    fetch("/api/curator/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.curatorId) {
          setCuratorId(data.curatorId);
          return fetch("/api/curator/progress").then((r) => r.json());
        }
      })
      .then((p) => p && setProgress(p))
      .catch(() => {});
  }, []);

  function handleAuth(id: number) {
    setCuratorId(id);
    setShowAuth(false);
    fetch("/api/curator/progress")
      .then((r) => r.json())
      .then(setProgress);
  }

  const currentStep = progress?.canApply
    ? 2
    : progress && progress.completedLessons > 0
      ? 1
      : 0;

  return (
    <>
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <BookOpen size={16} />
            Обучение кураторов
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4 leading-tight">
            Добро пожаловать в обучение кураторов{" "}
            <span className="text-accent-dark">GlucoseOnline</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto mb-8">
            Освойте работу с admin.glucoseonline.kz: пройдите видео-уроки,
            сдайте тест и получите доступ к админ-панели.
          </p>

          <ProgressBar
            steps={["Видео", "Тест", "Заявка"]}
            current={currentStep}
          />

          {curatorId && progress ? (
            <Card className="max-w-md mx-auto mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-primary">
                  Ваш прогресс
                </span>
                <span className="text-sm text-muted">
                  {progress.completedLessons}/{progress.totalLessons} уроков
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
                <div
                  className="bg-accent h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
              {progress.canApply ? (
                <Link href="/apply">
                  <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    Подать заявку на доступ
                  </Button>
                </Link>
              ) : (
                <Link href="/learn">
                  <Button className="w-full flex items-center justify-center gap-2">
                    Продолжить обучение
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/learn">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto flex items-center gap-2">
                  Начать обучение
                  <ArrowRight size={20} />
                </Button>
              </Link>
              {!curatorId && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowAuth(true)}
                  className="w-full sm:w-auto"
                >
                  Войти для сохранения прогресса
                </Button>
              )}
            </div>
          )}
        </section>

        {showAuth && (
          <div className="mb-10">
            <CuratorAuth onAuthenticated={handleAuth} />
          </div>
        )}

        <section className="grid sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "Видео-уроки",
              desc: "Пошаговые инструкции по работе с админ-панелью",
            },
            {
              step: "2",
              title: "Тестирование",
              desc: "Проверка знаний после каждого раздела",
            },
            {
              step: "3",
              title: "Заявка на доступ",
              desc: "Автоматическая отправка данных для получения доступа",
            },
          ].map((item) => (
            <Card key={item.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold text-primary mb-1">{item.title}</h3>
              <p className="text-sm text-muted">{item.desc}</p>
            </Card>
          ))}
        </section>
      </main>
    </>
  );
}
