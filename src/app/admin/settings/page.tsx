"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

interface Settings {
  sequentialLessons: boolean;
  testMode: string;
  passingScore: number;
  welcomeTitle: string;
  welcomeText: string;
  applicationConfirmMsg: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/dashboard");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setSettings(data.settings);
  }

  async function save() {
    if (!settings) return;
    await fetch("/api/admin/dashboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "settings", data: settings }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Настройки</h1>

      <div className="space-y-6 max-w-lg">
        <Card className="space-y-4">
          <h2 className="font-semibold text-primary">Обучение</h2>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.sequentialLessons}
              onChange={(e) => setSettings({ ...settings, sequentialLessons: e.target.checked })}
              className="w-4 h-4 accent-primary" />
            <span className="text-sm">Последовательный порядок уроков</span>
          </label>
          <div>
            <label className="text-sm font-medium block mb-1">Режим тестирования</label>
            <select value={settings.testMode} onChange={(e) => setSettings({ ...settings, testMode: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200">
              <option value="per_lesson">Тест после каждого урока</option>
              <option value="final">Один финальный тест</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Проходной балл (%)</label>
            <input type="number" min={0} max={100} value={settings.passingScore}
              onChange={(e) => setSettings({ ...settings, passingScore: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200" />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-primary">Тексты</h2>
          <div>
            <label className="text-sm font-medium block mb-1">Заголовок приветствия</label>
            <input value={settings.welcomeTitle} onChange={(e) => setSettings({ ...settings, welcomeTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Текст приветствия</label>
            <textarea value={settings.welcomeText} onChange={(e) => setSettings({ ...settings, welcomeText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200" rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Сообщение после заявки</label>
            <textarea value={settings.applicationConfirmMsg} onChange={(e) => setSettings({ ...settings, applicationConfirmMsg: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200" rows={2} />
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold text-primary">Уведомления</h2>
          <p className="text-sm text-muted">
            Настройте переменные окружения в файле <code className="bg-gray-100 px-1 rounded">.env</code>:
          </p>
          <ul className="text-sm space-y-1 text-muted">
            <li><code>TELEGRAM_BOT_TOKEN</code> — токен Telegram-бота</li>
            <li><code>TELEGRAM_CHAT_ID</code> — ID чата/группы</li>
            <li><code>SMTP_*</code> — настройки email</li>
            <li><code>ANTHROPIC_API_KEY</code> — ключ Claude API для чат-бота</li>
          </ul>
        </Card>

        <Button onClick={save} className="w-full sm:w-auto">
          {saved ? "Сохранено ✓" : "Сохранить настройки"}
        </Button>
      </div>
    </div>
  );
}
