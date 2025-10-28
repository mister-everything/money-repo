"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProbFormLayoutProps {
  children: React.ReactNode;
}

export function ProbFormLayout({ children }: ProbFormLayoutProps) {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-end">
          <ThemeToggle />
        </div>

        <Tabs defaultValue="create" className="w-full">
          <div className="mb-8">
            <h1 className="mb-6 text-2xl font-semibold text-foreground">
              어떤 문제집을 만들고 싶나요?
            </h1>
            <TabsList>
              <TabsTrigger value="solve">문제 풀기</TabsTrigger>
              <TabsTrigger value="create">문제 생성</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="solve">
            <div className="text-muted-foreground">문제 풀기 화면</div>
          </TabsContent>

          <TabsContent value="create">{children}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
