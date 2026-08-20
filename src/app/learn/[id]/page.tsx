"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import Link from "next/link";
import { PublicHeader, Button, Card } from "@/components/ui";
import { CheckCircle, ArrowLeft, ClipboardCheck } from "lucide-react";
import { parseChecklist, getVideoEmbedUrl } from "@/lib/utils";

interface LessonData {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  videoType: string;
  checklist: string;
  test?: { id: number } | null;
  topic: { title: string };
}

export default function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [curatorId, setCuratorId] = useState<number | null>(null);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveProgress = useCallback(
    async (percent: number) => {
      if (!curatorId) return;
      const res = await fetch("/api/curator/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: Number(id), watchedPercent: percent }),
      });
      const data = await res.json();
      if (data.completed) setCompleted(true);
    },
    [curatorId, id]
  );

  useEffect(() => {
    fetch("/api/curator/auth")
      .then((r) => r.json())
      .then((d) => d.curatorId && setCuratorId(d.curatorId));

    fetch(`/api/learn/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setLesson(data);
        if (data.progress?.completed) {
          setCompleted(true);
          setWatchedPercent(100);
        }
      });
  }, [id]);

  useEffect(() => {
    if (completed) return;

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const estimatedDuration = 300;
      const percent = Math.min(Math.round((elapsed / estimatedDuration) * 100), 100);
      setWatchedPercent(percent);

      if (percent >= 80 && !completed) {
        setCompleted(true);
        saveProgress(percent);
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [completed, saveProgress]);

  useEffect(() => {
    return () => {
      if (curatorId && watchedPercent > 0) {
        saveProgress(watchedPercent);
      }
    };
  }, [curatorId, watchedPercent, saveProgress]);

  if (!lesson) {
    return (
      <>
        <PublicHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />
        </main>
      </>
    );
  }

  const checklist = parseChecklist(lesson.checklist);
  const embedUrl = getVideoEmbedUrl(lesson.videoUrl, lesson.videoType);

  return (
    <>
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-4"
        >
          <ArrowLeft size={16} /> Назад к урокам
        </Link>

        <p className="text-sm text-accent-dark font-medium mb-1">
          {lesson.topic.title}
        </p>
        <h1 className="text-2xl font-bold text-primary mb-4">{lesson.title}</h1>

        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-4">
          {lesson.videoType === "direct" ? (
            <video
              src={embedUrl}
              controls
              className="w-full h-full"
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                const pct = Math.round((v.currentTime / v.duration) * 100);
                setWatchedPercent(pct);
                if (pct >= 80 && !completed) {
                  setCompleted(true);
                  saveProgress(pct);
                }
              }}
            />
          ) : (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${completed ? "bg-accent" : "bg-primary/40"}`}
              style={{ width: `${Math.min(watchedPercent, 100)}%` }}
            />
          </div>
          {completed ? (
            <span className="text-sm text-accent-dark font-medium flex items-center gap-1">
              <CheckCircle size={16} /> Просмотрено
            </span>
          ) : (
            <span className="text-sm text-muted">{watchedPercent}%</span>
          )}
        </div>

        <Card className="mb-4">
          <h2 className="font-semibold text-primary mb-2">Описание</h2>
          <p className="text-muted leading-relaxed">{lesson.description}</p>
        </Card>

        {checklist.length > 0 && (
          <Card className="mb-6">
            <h2 className="font-semibold text-primary mb-3">
              Что нужно запомнить
            </h2>
            <ul className="space-y-2">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle
                    size={16}
                    className="text-accent-dark shrink-0 mt-0.5"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {completed && lesson.test && (
          <Link href={`/test/${lesson.test.id}`}>
            <Button
              variant="secondary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
            >
              <ClipboardCheck size={20} />
              Пройти тест
            </Button>
          </Link>
        )}
      </main>
    </>
  );
}
