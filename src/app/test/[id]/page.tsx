"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { PublicHeader, Button, Card } from "@/components/ui";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  text: string;
  type: string;
  options: { text: string }[];
}

interface TestData {
  id: number;
  title: string;
  questions: Question[];
  lesson?: { title: string } | null;
}

export default function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [test, setTest] = useState<TestData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string | number | number[]>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    passingScore: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/tests?testId=${id}`)
      .then((r) => r.json())
      .then(setTest);
  }, [id]);

  function setSingleAnswer(qId: number, value: number) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  function toggleMultipleAnswer(qId: number, value: number) {
    setAnswers((prev) => {
      const current = (prev[qId] as number[]) || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [qId]: next };
    });
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: Number(id), answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  if (!test) {
    return (
      <>
        <PublicHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />
        </main>
      </>
    );
  }

  if (result) {
    return (
      <>
        <PublicHeader />
        <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
          <Card className="text-center max-w-md mx-auto">
            {result.passed ? (
              <CheckCircle size={48} className="text-accent-dark mx-auto mb-4" />
            ) : (
              <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            )}
            <h1 className="text-2xl font-bold text-primary mb-2">
              {result.passed ? "Тест пройден!" : "Тест не пройден"}
            </h1>
            <p className="text-muted mb-1">
              Ваш результат: <strong>{result.score}%</strong>
            </p>
            <p className="text-sm text-muted mb-6">
              Проходной балл: {result.passingScore}%
            </p>
            {result.passed ? (
              <Link href="/apply">
                <Button variant="secondary" className="w-full">
                  Подать заявку на доступ
                </Button>
              </Link>
            ) : (
              <Button onClick={() => { setResult(null); setAnswers({}); }} className="w-full">
                Попробовать снова
              </Button>
            )}
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-4"
        >
          <ArrowLeft size={16} /> Назад
        </Link>

        <h1 className="text-2xl font-bold text-primary mb-1">{test.title}</h1>
        {test.lesson && (
          <p className="text-sm text-muted mb-6">Урок: {test.lesson.title}</p>
        )}

        <div className="space-y-4">
          {test.questions.map((q, qi) => (
            <Card key={q.id}>
              <p className="font-medium text-primary mb-3">
                {qi + 1}. {q.text}
              </p>

              {q.type === "text" ? (
                <input
                  type="text"
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ваш ответ"
                />
              ) : q.type === "multiple" ? (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const selected = ((answers[q.id] as number[]) || []).includes(oi);
                    return (
                      <button
                        key={oi}
                        onClick={() => toggleMultipleAnswer(q.id, oi)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm",
                          selected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setSingleAnswer(q.id, oi)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm",
                        answers[q.id] === oi
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        <Button
          onClick={submit}
          disabled={
            submitting ||
            test.questions.some((q) => {
              const a = answers[q.id];
              if (q.type === "multiple") return !(a as number[])?.length;
              return a === undefined || a === "";
            })
          }
          size="lg"
          className="w-full mt-6"
        >
          {submitting ? "Проверка..." : "Отправить ответы"}
        </Button>
      </main>
    </>
  );
}
