import { userService } from "@service/auth/user.service";
import { format } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | Solves",
  description: "Solves 서비스의 개인정보 처리방침입니다.",
};

export default async function PrivacyPolicyPage() {
  // DB에서 최신 개인정보 처리방침 조회
  const policy = await userService.getLatestPolicyVersion("privacy");

  if (!policy) {
    notFound();
  }

  return (
    <div className="container max-w-4xl py-12 px-4">
      <Card className="shadow-none border-none">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">{policy.title}</CardTitle>
            <span className="text-sm text-muted-foreground">
              버전 {policy.version}
            </span>
          </div>
          <CardDescription>
            시행일: {format(new Date(policy.effectiveAt), "yyyy년 M월 d일")}
          </CardDescription>
        </CardHeader>

        <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
          {/* 마크다운 콘텐츠를 HTML로 렌더링 */}
          <div
            className="whitespace-pre-wrap leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatPolicyContent(policy.content) }}
          />

          {/* 푸터 */}
          <div className="pt-8 text-center text-sm text-muted-foreground border-t mt-8">
            <p>
              본 개인정보 처리방침은{" "}
              {format(new Date(policy.effectiveAt), "yyyy년 M월 d일")}부터
              시행됩니다.
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} Solves. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 약관 콘텐츠를 HTML로 변환
 * 간단한 마크다운 변환 (제목, 리스트, 강조 등)
 */
function formatPolicyContent(content: string): string {
  return content
    // 제목 변환 (## -> h2, ### -> h3)
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-4">$1</h2>')
    // 구분선
    .replace(/^---$/gm, '<hr class="my-6 border-border" />')
    // 강조 (**text**)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // 리스트
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    // 연속된 li를 ul로 감싸기 (간단한 처리)
    .replace(
      /(<li[^>]*>.*?<\/li>\n?)+/g,
      '<ul class="list-disc list-inside space-y-2 text-muted-foreground my-4">$&</ul>',
    )
    // 줄바꿈
    .replace(/\n\n/g, "</p><p class='text-muted-foreground leading-relaxed my-4'>")
    .replace(/^(.+)$/gm, (match) => {
      // 이미 HTML 태그가 있으면 그대로 반환
      if (match.startsWith("<")) return match;
      return match;
    });
}
