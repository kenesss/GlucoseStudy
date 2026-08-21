"use client";

import { useState, useEffect } from "react";
import { PublicHeader, Button, Card } from "@/components/ui";
import { CuratorAuth } from "@/components/CuratorAuth";
import { CheckCircle, Send } from "lucide-react";

export default function ApplyPage() {
  const [curatorId, setCuratorId] = useState<number | null>(null);
  const [canApply, setCanApply] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    streamName: "",
  });

  useEffect(() => {
    fetch("/api/curator/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.curatorId) {
          setCuratorId(data.curatorId);
          return fetch("/api/curator/progress").then((r) => r.json());
        }
      })
      .then((p) => p && setCanApply(p.canApply));
  }, []);

  function handleAuth(id: number) {
    setCuratorId(id);
    fetch("/api/curator/progress")
      .then((r) => r.json())
      .then((p) => setCanApply(p.canApply));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfirmMsg(
        data.confirmMessage ||
          "Өтінім жіберілді! admin.glucoseonline.kz қолжетімділігі 24 сағат ішінде беріледі."
      );
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Жіберу қатесі");
    } finally {
      setLoading(false);
    }
  }

  if (!curatorId) {
    return (
      <>
        <PublicHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-primary mb-4">
            Қолжетімділікке өтінім
          </h1>
          <CuratorAuth onAuthenticated={handleAuth} />
        </main>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <PublicHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center max-w-md mx-auto animate-fade-in">
            <CheckCircle
              size={48}
              className="text-accent-dark mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-primary mb-3">
              Өтінім жіберілді!
            </h1>
            <p className="text-muted">{confirmMsg}</p>
          </Card>
        </main>
      </>
    );
  }

  if (!canApply) {
    return (
      <>
        <PublicHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center max-w-md mx-auto">
            <h1 className="text-xl font-bold text-primary mb-2">
              Өтінім әзірге қолжетімсіз
            </h1>
            <p className="text-muted mb-4">
              Алдымен барлық бейнесабақтарды өтіп, өту балымен тест
              тапсырыңыз.
            </p>
            <Button onClick={() => (window.location.href = "/learn")}>
              Оқытуға өту
            </Button>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-primary mb-2">
          Қолжетімділікке өтінім
        </h1>
        <p className="text-muted mb-6">
          Форманы толтырыңыз — admin.glucoseonline.kz қолжетімділігін береміз
        </p>

        <Card className="max-w-lg">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-primary block mb-1">
                  Аты *
                </label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-primary block mb-1">
                  Тегі *
                </label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-primary block mb-1">
                Телефон *
              </label>
              <input
                required
                type="tel"
                placeholder="+7 777 123 4567"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-primary block mb-1">
                Email *
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-primary block mb-1">
                Ағын *
              </label>
              <input
                required
                placeholder="Ағынның атауы немесе нөмірі"
                value={form.streamName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, streamName: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {loading ? "Жіберілуде..." : "Өтінім жіберу"}
            </Button>
          </form>
        </Card>
      </main>
    </>
  );
}
