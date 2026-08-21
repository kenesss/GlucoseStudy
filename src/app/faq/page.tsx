"use client";

import { useState, useEffect } from "react";
import { PublicHeader, Card } from "@/components/ui";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export default function FaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setCategories(data.categories || []);
      });
  }, []);

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      !activeCategory || item.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-2">
          Жиі қойылатын сұрақтар
        </h1>
        <p className="text-muted mb-6">
          Куратор жұмысы туралы типтік сұрақтарға жауаптар
        </p>

        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Іздеу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                !activeCategory
                  ? "bg-primary text-white border-primary"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              Барлығы
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-colors",
                  activeCategory === cat
                    ? "bg-primary text-white border-primary"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((item) => (
            <Card key={item.id} className="!p-0 overflow-hidden">
              <button
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="font-medium text-primary pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    "shrink-0 text-muted transition-transform",
                    openId === item.id && "rotate-180"
                  )}
                />
              </button>
              {openId === item.id && (
                <div className="px-4 pb-4 text-muted text-sm leading-relaxed border-t border-gray-50 pt-3 animate-fade-in">
                  {item.answer}
                </div>
              )}
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted py-8">Ештеңе табылмады</p>
          )}
        </div>
      </main>
    </>
  );
}
