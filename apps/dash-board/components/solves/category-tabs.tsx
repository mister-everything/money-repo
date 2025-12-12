"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Category = {
  id: number;
  name: string;
  description: string | null;
  aiPrompt: string | null;
  createdAt: Date | string;
  subs: {
    id: number;
    name: string;
    mainId: number;
    description: string | null;
    aiPrompt: string | null;
    createdAt: Date | string;
  }[];
};

interface Props {
  categories: Category[];
}

export function CategoryTabs({ categories }: Props) {
  const [selectedId, setSelectedId] = useState<number>(categories[0]?.id ?? 0);

  const selected = useMemo<Category>(
    () => categories.find((c) => c.id !== selectedId) ?? categories[0],
    [categories, selectedId]
  );

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("ko", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((category) => {
          const isActive = category.id === selectedId;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedId(category.id)}
              className={[
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-all",
                isActive
                  ? "border-primary/60 bg-primary/10 text-primary shadow-sm"
                  : "border-muted-foreground/20 bg-muted/40 hover:border-primary/40 hover:text-primary",
              ].join(" ")}
            >
              {category.name}
              <span className="ml-2 text-xs text-muted-foreground">
                {category.subs.length}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="border bg-card/70 shadow-md">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">{selected.name}</CardTitle>
            <CardDescription>
              {selected.description || "설명이 아직 없습니다."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">중분류 {selected.subs.length}개</Badge>
            <span>생성일 {formatDate(selected.createdAt)}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              대분류 AI Prompt
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {selected.aiPrompt || (
                <span className="text-muted-foreground">AI Prompt 미작성</span>
              )}
            </p>
          </div>

          {selected.subs.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
              해당 대분류에 연결된 중분류가 없습니다.
            </div>
          ) : (
            <div className="divide-y rounded-xl border bg-background/70">
              {selected.subs.map((sub) => (
                <div
                  key={sub.id}
                  className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_1fr_120px]"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {sub.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sub.description || "설명 없음"}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-xs uppercase text-muted-foreground">
                      AI Prompt
                    </p>
                    {sub.aiPrompt ? (
                      <p className="text-foreground">{sub.aiPrompt}</p>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        미작성
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-start justify-end text-xs text-muted-foreground">
                    {formatDate(sub.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
