"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";

interface KnowledgeItem {
  id: number;
  title: string;
  content: string;
}

export default function AdminKnowledgePage() {
  const router = useRouter();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/dashboard");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setItems(data.knowledge || []);
  }

  async function save() {
    await fetch("/api/admin/dashboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "knowledge", id: editId, ...form }),
    });
    setShowForm(false);
    setEditId(null);
    setForm({ title: "", content: "" });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Удалить?")) return;
    await fetch("/api/admin/dashboard", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "knowledge", id }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">База знаний</h1>
          <p className="text-sm text-muted">Материалы для чат-бота (RAG)</p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); }}>
          <Plus size={16} className="mr-1" /> Добавить
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 animate-fade-in space-y-3">
          <input placeholder="Заголовок" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200" />
          <textarea placeholder="Содержание" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200" rows={6} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Сохранить</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-primary">{item.title}</p>
                <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{item.content}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => { setEditId(item.id); setForm(item); setShowForm(true); }} className="text-xs text-primary px-2 py-1 hover:bg-gray-50 rounded">Изменить</button>
                <button onClick={() => remove(item.id)} className="p-1 text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
