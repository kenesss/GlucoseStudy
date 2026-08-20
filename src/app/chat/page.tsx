"use client";

import { useState, useRef, useEffect } from "react";
import { PublicHeader, Button, Card } from "@/components/ui";
import { Send, Bot, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  escalated?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Привет! Я помощник по работе с admin.glucoseonline.kz. Задайте вопрос о работе куратора.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(escalate = false) {
    if (!input.trim() && !escalate) return;
    const userMsg = escalate
      ? "Хочу задать вопрос специалисту"
      : input.trim();
    if (!escalate) {
      setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
      setInput("");
    }
    setLoading(true);

    try {
      const history = messages.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: escalate ? messages[messages.length - 1]?.content || userMsg : userMsg,
          sessionId,
          history,
          escalate,
        }),
      });
      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, escalated: data.escalated },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Произошла ошибка. Попробуйте позже.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-primary">Чат-помощник</h1>
          <p className="text-sm text-muted">
            Задайте вопрос о работе с админ-панелью
          </p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden !p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-gray-50 text-gray-800 rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center shrink-0">
                    <User size={16} className="text-primary" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot size={16} className="text-primary animate-pulse-dot" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-gray-50 text-sm text-muted">
                  Печатает...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-100 p-3">
            {messages.some((m) => m.escalated) && (
              <p className="text-xs text-muted mb-2 text-center">
                Не нашли ответ? Нажмите кнопку ниже
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && send()}
                placeholder="Ваш вопрос..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
              <Button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="shrink-0 !px-3"
              >
                <Send size={18} />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => send(true)}
              disabled={loading || messages.length < 2}
              className="w-full mt-2 flex items-center justify-center gap-1 text-sm"
            >
              <MessageCircle size={14} />
              Задать вопрос человеку
            </Button>
          </div>
        </Card>
      </main>
    </>
  );
}
