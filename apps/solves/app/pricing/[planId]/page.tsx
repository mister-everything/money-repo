"use client";
import { Construction } from "lucide-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FaultyTerminal = dynamic(
  () => import("@/components/ui/faulty-terminal").then((mod) => mod.default),
  {
    ssr: false,
  },
);
export default function PlanPaymentPage() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="h-screen relative flex items-center justify-center">
      <div className="fixed inset-0 -z-10 w-full h-screen opacity-50">
        <FaultyTerminal
          tint={resolvedTheme === "dark" ? "#d0d0d0" : "#050610"}
          mouseReact={false}
          brightness={resolvedTheme === "dark" ? 0.6 : 4}
        />
      </div>

      <Card className="relative shadow-none flex flex-col gap-4 justify-center w-full max-w-xl mx-auto bg-transparent border-none fade-1000">
        <div
          className="absolute -inset-64 -z-10 pointer-events-none rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, var(--background) 0%, var(--background) 30%, transparent 70%)",
          }}
        />
        <CardHeader className="flex flex-col items-center">
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <Construction className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            베타 서비스 안내
          </CardTitle>
          <CardDescription className="text-lg pt-2"></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            아직 결제 시스템이 연동되지 않았습니다.
            <br />
            모든 기능을 무료로 체험해 보실 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
