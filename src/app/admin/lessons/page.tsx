"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  videoUrl: string;
  videoType: string;
  order: number;
  test?: { id: number; _count: { questions: number } } | null;
}

interface Topic {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

export default function AdminLessonsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showForm, setShowForm] = useState<"topic" | "lesson" | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    videoType: "youtube",
    topicId: 0,
    order: 0,
    checklist: "",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/lessons");
    if (res.status === 401) { router.push("/admin/login"); return; }
    setTopics(await res.json());
  }

  async function save(type: "topic" | "lesson") {
    const method = editId ? "PUT" : "POST";
    const body: Record<string, unknown> = {
      type,
      ...(editId ? { id: editId } : {}),
      title: form.title,
      order: form.order,
    };
    if (type === "lesson") {
      body.description = form.description;
      body.videoUrl = form.videoUrl;
      body.videoType = form.videoType;
      body.topicId = form.topicId;
      body.checklist = form.checklist.split("\n").filter(Boolean);
    }
    await fetch("/api/admin/lessons", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowForm(null);
    setEditId(null);
    setForm({ title: "", description: "", videoUrl: "", videoType: "youtube", topicId: 0, order: 0, checklist: "" });
    load();
  }

  async function remove(type: "topic" | "lesson", id: number) {
    if (!confirm("Удалить?")) return;
    await fetch("/api/admin/lessons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Уроки</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setShowForm("topic"); setEditId(null); }}>
            <Plus size={16} className="mr-1" /> Тема
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setShowForm("lesson"); setEditId(null); }}>
            <Plus size={16} className="mr-1" /> Урок
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6 animate-fade-in">
          <h2 className="font-semibold mb-3">{editId ? "Редактировать" : "Добавить"} {showForm === "topic" ? "тему" : "урок"}</h2>
          <div className="space-y-3">
            <input placeholder="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200" />
            {showForm === "lesson" && (
              <>
                <select value={form.topicId} onChange={(e) => setForm({ ...form, topicId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200">
                  <option value={0}>Выберите тему</option>
                  {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
                <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200" rows={2} />
                <input placeholder="URL видео (YouTube/Vimeo)" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <select value={form.videoType} onChange={(e) => setForm({ ...form, videoType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200">
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="direct">Прямая ссылка</option>
                </select>
                <textarea placeholder="Чек-лист (каждый пункт с новой строки)" value={form.checklist} onChange={(e) => setForm({ ...form, checklist: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200" rows={3} />
              </>
            )}
            <input type="number" placeholder="Порядок" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save(showForm)}>Сохранить</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(null)}>Отмена</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {topics.map((topic) => (
          <Card key={topic.id}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-primary">{topic.title}</h2>
              <div className="flex gap-1">
                <button onClick={() => remove("topic", topic.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
            {topic.lessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between py-2 border-t border-gray-50">
                <div>
                  <p className="text-sm font-medium">{lesson.title}</p>
                  <p className="text-xs text-muted">{lesson.videoType} · {lesson.test ? `${lesson.test._count.questions} вопросов` : "без теста"}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => {
                    setShowForm("lesson"); setEditId(lesson.id);
                    setForm({ title: lesson.title, description: "", videoUrl: lesson.videoUrl, videoType: lesson.videoType, topicId: topic.id, order: lesson.order, checklist: "" });
                  }} className="p-1.5 hover:bg-gray-50 rounded"><Edit2 size={16} /></button>
                  <button onClick={() => remove("lesson", lesson.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
