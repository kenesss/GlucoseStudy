"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PublicHeader, Card, Button } from "@/components/ui";
import { CuratorAuth } from "@/components/CuratorAuth";
import {
  Play,
  CheckCircle,
  Lock,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: number;
  title: string;
  description: string;
  order: number;
  locked: boolean;
  completed: boolean;
  test?: { id: number; title: string } | null;
}

interface Topic {
  id: number;
  title: string;
  lessons: Lesson[];
}

export default function LearnPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [curatorId, setCuratorId] = useState<number | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const meRes = await fetch("/api/curator/auth");
      const me = await meRes.json();
      if (me.curatorId) setCuratorId(me.curatorId);

      const res = await fetch("/api/learn");
      const data = await res.json();
      setTopics(data.topics || []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }

  function handleAuth(id: number) {
    setCuratorId(id);
    setShowAuth(false);
    loadData();
  }

  if (loading) {
    return (
      <>
        <PublicHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Обучение</h1>
        <p className="text-muted mb-6">
          Пройдите все уроки по порядку. Следующий урок откроется после
          просмотра предыдущего.
        </p>

        {!curatorId && (
          <div className="mb-6">
            <Card className="bg-accent/10 border-accent/30">
              <p className="text-sm text-primary mb-3">
                Войдите, чтобы сохранять прогресс просмотра
              </p>
              <Button size="sm" onClick={() => setShowAuth(true)}>
                Войти
              </Button>
            </Card>
            {showAuth && (
              <div className="mt-4">
                <CuratorAuth onAuthenticated={handleAuth} />
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {topics.map((topic) => (
            <div key={topic.id}>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                {topic.title}
              </h2>
              <div className="space-y-2">
                {topic.lessons.map((lesson) => (
                  <Card
                    key={lesson.id}
                    className={cn(
                      "flex items-center gap-4 transition-opacity",
                      lesson.locked && "opacity-50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        lesson.completed
                          ? "bg-accent text-primary"
                          : lesson.locked
                            ? "bg-gray-100 text-muted"
                            : "bg-primary/10 text-primary"
                      )}
                    >
                      {lesson.completed ? (
                        <CheckCircle size={20} />
                      ) : lesson.locked ? (
                        <Lock size={18} />
                      ) : (
                        <Play size={18} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-primary truncate">
                        {lesson.title}
                      </h3>
                      <p className="text-sm text-muted truncate">
                        {lesson.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {lesson.completed && lesson.test && (
                        <Link href={`/test/${lesson.test.id}`}>
                          <Button size="sm" variant="outline" className="hidden sm:flex items-center gap-1">
                            <ClipboardCheck size={14} />
                            Тест
                          </Button>
                        </Link>
                      )}
                      {!lesson.locked ? (
                        <Link href={`/learn/${lesson.id}`}>
                          <Button size="sm" className="flex items-center gap-1">
                            {lesson.completed ? "Повторить" : "Смотреть"}
                            <ChevronRight size={16} />
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
