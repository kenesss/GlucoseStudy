"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { Users, BookOpen, ClipboardCheck, MessageCircle } from "lucide-react";

interface DashboardData {
  applications: { id: number; status: string; firstName: string; lastName: string; createdAt: string }[];
  testResults: { id: number; score: number; passed: boolean; curator: { email: string | null }; test: { title: string }; createdAt: string }[];
  escalated: { id: number; question: string; createdAt: string }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return r.json();
      })
      .then((d) => d && setData(d));
  }, [router]);

  if (!data) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;
  }

  const newApps = data.applications.filter((a) => a.status === "new").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Обзор</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Новые заявки", value: newApps, icon: Users, color: "text-blue-600" },
          { label: "Всего заявок", value: data.applications.length, icon: ClipboardCheck, color: "text-primary" },
          { label: "Результаты тестов", value: data.testResults.length, icon: BookOpen, color: "text-accent-dark" },
          { label: "Вопросы кураторов", value: data.escalated.length, icon: MessageCircle, color: "text-orange-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <stat.icon size={24} className={stat.color} />
              <div>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-primary mb-3">Последние заявки</h2>
          {data.applications.slice(0, 5).map((app) => (
            <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium">{app.firstName} {app.lastName}</p>
                <p className="text-xs text-muted">{new Date(app.createdAt).toLocaleDateString("ru")}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === "new" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                {app.status === "new" ? "Новая" : "Доступ выдан"}
              </span>
            </div>
          ))}
          {data.applications.length === 0 && (
            <p className="text-sm text-muted">Заявок пока нет</p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-primary mb-3">Вопросы без ответа</h2>
          {data.escalated.slice(0, 5).map((q) => (
            <div key={q.id} className="py-2 border-b border-gray-50 last:border-0">
              <p className="text-sm">{q.question}</p>
              <p className="text-xs text-muted">{new Date(q.createdAt).toLocaleDateString("ru")}</p>
            </div>
          ))}
          {data.escalated.length === 0 && (
            <p className="text-sm text-muted">Нет нерешённых вопросов</p>
          )}
        </Card>
      </div>
    </div>
  );
}
