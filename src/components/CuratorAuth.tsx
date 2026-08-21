"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Card } from "./ui";
import { Mail, Phone, ArrowRight, MessageCircle, RefreshCw } from "lucide-react";

interface CuratorAuthProps {
  onAuthenticated: (curatorId: number) => void;
}

type SendMethod = "telegram" | "email" | "link_required" | "dev";

export function CuratorAuth({ onAuthenticated }: CuratorAuthProps) {
  const [step, setStep] = useState<"contact" | "otp" | "link">("contact");
  const [contactType, setContactType] = useState<"phone" | "email">("phone");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [telegramLinkUrl, setTelegramLinkUrl] = useState("");
  const [sendMethod, setSendMethod] = useState<SendMethod | null>(null);
  const [checkingTelegram, setCheckingTelegram] = useState(false);

  useEffect(() => {
    fetch("/api/curator/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.curatorId) onAuthenticated(data.curatorId);
      })
      .catch(() => {});
  }, [onAuthenticated]);

  const checkTelegramLinked = useCallback(async () => {
    if (contactType !== "phone" || !contact) return false;
    setCheckingTelegram(true);
    try {
      const res = await fetch(
        `/api/curator/telegram-status?phone=${encodeURIComponent(contact)}`
      );
      const data = await res.json();
      return data.linked === true;
    } catch {
      return false;
    } finally {
      setCheckingTelegram(false);
    }
  }, [contact, contactType]);

  async function sendOtp() {
    setLoading(true);
    setError("");
    setDevOtp("");
    try {
      const res = await fetch("/api/curator/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          [contactType]: contact,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSendMethod(data.method);

      if (data.method === "link_required") {
        setTelegramLinkUrl(data.telegramLinkUrl);
        setStep("link");
        return;
      }

      if (data.devOtp) setDevOtp(data.devOtp);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Кодты жіберу қатесі");
    } finally {
      setLoading(false);
    }
  }

  async function handleTelegramLinked() {
    const linked = await checkTelegramLinked();
    if (linked) {
      await sendOtp();
    } else {
      setError(
        "Telegram әлі байланбаған. Ботта Start басып, қайта көріңіз."
      );
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/curator/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          [contactType]: contact,
          code: otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onAuthenticated(data.curatorId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате код");
    } finally {
      setLoading(false);
    }
  }

  const otpHint =
    sendMethod === "telegram"
      ? "Код Telegram-ға жіберілді"
      : sendMethod === "email"
        ? `Код ${contact} мекенжайына жіберілді`
        : "Кодты енгізіңіз";

  return (
    <Card className="max-w-md mx-auto animate-fade-in">
      <h2 className="text-xl font-bold text-primary mb-2">
        {step === "contact" && "Прогресті сақтау үшін кіру"}
        {step === "otp" && "Кодты енгізіңіз"}
        {step === "link" && "Telegram байлау"}
      </h2>
      <p className="text-sm text-muted mb-4">
        {step === "contact" &&
          "Телефон нөмірін көрсетіңіз — код Telegram-ға келеді"}
        {step === "otp" && otpHint}
        {step === "link" &&
          "Код алу үшін Telegram-ды байлау керек. Төмендегі батырманы басып, ботта Start басыңыз."}
      </p>

      {step === "contact" && (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setContactType("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-colors ${
                contactType === "phone"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200"
              }`}
            >
              <Phone size={16} /> Телефон
            </button>
            <button
              onClick={() => setContactType("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-colors ${
                contactType === "email"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200"
              }`}
            >
              <Mail size={16} /> Email
            </button>
          </div>
          <input
            type={contactType === "email" ? "email" : "tel"}
            placeholder={
              contactType === "email" ? "email@example.com" : "+7 777 123 4567"
            }
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <Button
            onClick={sendOtp}
            disabled={!contact || loading}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? "Жіберілуде..." : "Код алу"}
            <ArrowRight size={18} />
          </Button>
          {contactType === "email" && (
            <p className="text-xs text-muted mt-2 text-center">
              Email — Telegram қолжетімсіз болса, қосалқы тәсіл
            </p>
          )}
        </>
      )}

      {step === "link" && (
        <>
          <a
            href={telegramLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mb-3"
          >
            <Button
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Telegram байлау
            </Button>
          </a>
          <Button
            onClick={handleTelegramLinked}
            disabled={loading || checkingTelegram}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw
              size={16}
              className={checkingTelegram ? "animate-spin" : ""}
            />
            {checkingTelegram
              ? "Тексерілуде..."
              : "Байладым — код алу"}
          </Button>
          <button
            onClick={() => {
              setStep("contact");
              setError("");
            }}
            className="w-full mt-2 text-sm text-muted hover:text-primary"
          >
            Телефон нөмірін өзгерту
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-2 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {devOtp && (
            <p className="text-xs text-accent-dark bg-accent/20 rounded-lg px-3 py-2 mb-3">
              Dev mode — код: <strong>{devOtp}</strong>
            </p>
          )}
          <Button
            onClick={verifyOtp}
            disabled={otp.length !== 6 || loading}
            className="w-full"
          >
            {loading ? "Тексерілуде..." : "Кіру"}
          </Button>
          <button
            onClick={() => {
              setStep("contact");
              setOtp("");
              setError("");
            }}
            className="w-full mt-2 text-sm text-muted hover:text-primary"
          >
            {contactType === "email" ? "Email-ді" : "Телефонды"} өзгерту
          </button>
        </>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
      )}
    </Card>
  );
}
