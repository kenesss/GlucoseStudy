"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export default function AdminFaqPage() {
  const router = useRouter();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [form, setForm] = useState({ question: "", answer: "", category: "Общее", order: 0 });
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/faq");
    if (res.status === 401) { router.push("/admin/login"); return; }
    setItems(await res.json());
  }

  async function save() {
    const method = editId ? "PUT" : "POST";
    await fetch("/api/admin/faq", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editId }),
    });
    setShowForm(false);
    setEditId(null);
    setForm({ question: "", answer: "", category: "Общее", order: 0 });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Удалить?")) return;
    await fetch("/api/admin/faq", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">FAQ</h1>
        <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); }}>
          <Plus size={16} className="mr-1" /> Добавить
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 animate-fade-in space-y-3">
          <input placeholder="Вопрос" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200" />
          <textarea placeholder="Ответ" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200" rows={3} />
          <input placeholder="Категория" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200" />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Сохранить</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-primary text-sm">{item.question}</p>
              <p className="text-xs text-muted mt-1">{item.answer}</p>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">{item.category}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditId(item.id); setForm(item); setShowForm(true); }} className="p-1.5 hover:bg-gray-50 rounded"><Edit2 size={14} /></button>
              <button onClick={() => remove(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
