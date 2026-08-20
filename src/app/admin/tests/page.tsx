"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";
import { parseOptions } from "@/lib/utils";

interface Question {
  id: number;
  text: string;
  type: string;
  options: string;
  order: number;
}

interface Test {
  id: number;
  title: string;
  isFinal: boolean;
  lesson?: { title: string } | null;
  questions: Question[];
  _count: { results: number };
}

export default function AdminTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [qForm, setQForm] = useState({ text: "", type: "single", options: "", testId: 0 });

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/tests");
    if (res.status === 401) { router.push("/admin/login"); return; }
    setTests(await res.json());
  }

  async function addQuestion() {
    const options = qForm.options.split("\n").map((line) => {
      const isCorrect = line.startsWith("*");
      return { text: isCorrect ? line.slice(1).trim() : line.trim(), isCorrect };
    }).filter((o) => o.text);

    await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "question",
        entity: "question",
        testId: qForm.testId,
        text: qForm.text,
        questionType: qForm.type,
        options,
      }),
    });
    setQForm({ text: "", type: "single", options: "", testId: 0 });
    load();
  }

  async function deleteQuestion(id: number) {
    if (!confirm("Удалить вопрос?")) return;
    await fetch("/api/admin/tests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "question", id }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Тесты</h1>
      <p className="text-sm text-muted mb-4">
        Для правильного ответа начните строку со звёздочки (*)
      </p>

      <div className="space-y-4">
        {tests.map((test) => (
          <Card key={test.id}>
            <button
              onClick={() => setExpanded(expanded === test.id ? null : test.id)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="font-semibold text-primary">{test.title}</p>
                <p className="text-xs text-muted">
                  {test.isFinal ? "Финальный" : test.lesson?.title || "—"} · {test.questions.length} вопросов · {test._count.results} попыток
                </p>
              </div>
              <span className="text-muted text-sm">{expanded === test.id ? "▲" : "▼"}</span>
            </button>

            {expanded === test.id && (
              <div className="mt-4 space-y-3 border-t border-gray-50 pt-4 animate-fade-in">
                {test.questions.map((q, qi) => (
                  <div key={q.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{qi + 1}. {q.text}</p>
                      <p className="text-xs text-muted">{q.type}</p>
                      {q.type !== "text" && (
                        <ul className="text-xs mt-1 space-y-0.5">
                          {parseOptions(q.options).map((o, oi) => (
                            <li key={oi} className={o.isCorrect ? "text-green-600" : ""}>
                              {o.isCorrect ? "✓ " : "○ "}{o.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button onClick={() => deleteQuestion(q.id)} className="p-1 text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}

                <div className="border-t border-gray-50 pt-3 space-y-2">
                  <input placeholder="Текст вопроса" value={qForm.testId === test.id ? qForm.text : ""}
                    onFocus={() => setQForm({ ...qForm, testId: test.id })}
                    onChange={(e) => setQForm({ ...qForm, testId: test.id, text: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                  <select value={qForm.testId === test.id ? qForm.type : "single"}
                    onChange={(e) => setQForm({ ...qForm, testId: test.id, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                    <option value="single">Один ответ</option>
                    <option value="multiple">Несколько ответов</option>
                    <option value="text">Текстовый</option>
                  </select>
                  {qForm.type !== "text" && (
                    <textarea placeholder="Варианты (* = правильный)" value={qForm.testId === test.id ? qForm.options : ""}
                      onChange={(e) => setQForm({ ...qForm, testId: test.id, options: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" rows={3} />
                  )}
                  <Button size="sm" onClick={addQuestion} disabled={qForm.testId !== test.id || !qForm.text}>
                    <Plus size={14} className="mr-1" /> Добавить вопрос
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
