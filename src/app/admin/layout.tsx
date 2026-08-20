"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  HelpCircle,
  Brain,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/lessons", label: "Уроки", icon: BookOpen },
  { href: "/admin/tests", label: "Тесты", icon: ClipboardCheck },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/knowledge", label: "База знаний", icon: Brain },
  { href: "/admin/applications", label: "Заявки", icon: FileText },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex flex-col w-60 bg-primary text-white shrink-0">
        <div className="p-4 border-b border-white/10">
          <Link href="/admin" className="font-bold text-lg">
            Glucose<span className="text-accent">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === href
                  ? "bg-white/15 text-accent"
                  : "hover:bg-white/10"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/10 border-t border-white/10"
        >
          <LogOut size={16} /> Выйти
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-primary text-white px-4 h-14 flex items-center justify-between">
          <span className="font-bold">GlucoseAdmin</span>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
        {menuOpen && (
          <nav className="lg:hidden bg-primary text-white border-t border-white/10">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm border-b border-white/5",
                  pathname === href ? "bg-white/10 text-accent" : ""
                )}
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-3 text-sm w-full"
            >
              <LogOut size={16} /> Выйти
            </button>
          </nav>
        )}
        <main className="flex-1 p-4 lg:p-8 bg-surface overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
