"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

interface Application {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  streamName: string;
  testScore: number | null;
  status: string;
  createdAt: string;
  curator?: { telegramLinked: boolean } | null;
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/dashboard");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setApps(data.applications || []);
  }

  async function updateStatus(id: number, status: string) {
    await fetch("/api/admin/dashboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "application_status", id, status }),
    });
    load();
  }

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Заявки на доступ</h1>

      <div className="flex gap-2 mb-4">
        {[
          { key: "all", label: "Все" },
          { key: "new", label: "Новые" },
          { key: "granted", label: "Доступ выдан" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm border ${filter === f.key ? "bg-primary text-white border-primary" : "border-gray-200"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((app) => (
          <Card key={app.id}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-primary">{app.firstName} {app.lastName}</p>
                <p className="text-sm text-muted">{app.email} · {app.phone}</p>
                <p className="text-sm">Поток: {app.streamName}</p>
                {app.testScore !== null && (
                  <p className="text-xs text-muted">Тест: {app.testScore}%</p>
                )}
                <p className="text-xs text-muted">
                  Telegram:{" "}
                  {app.curator?.telegramLinked ? "привязан" : "не привязан"}
                </p>
                <p className="text-xs text-muted mt-1">
                  {new Date(app.createdAt).toLocaleString("ru")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${app.status === "new" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                  {app.status === "new" ? "Новая" : "Доступ выдан"}
                </span>
                {app.status === "new" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(app.id, "granted")}>
                    Выдать доступ
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted py-8">Заявок нет</p>
        )}
      </div>
    </div>
  );
}
