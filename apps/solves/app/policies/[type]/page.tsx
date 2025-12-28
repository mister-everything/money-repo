import { policyService } from "@service/auth";
import { PolicyType } from "@service/auth/shared";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Streamdown } from "streamdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PoliciesPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const policy = await policyService.getLatestPolicyVersion(type as PolicyType);
  if (!policy) {
    notFound();
  }
  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto">
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

        <CardContent className="mx-auto">
          {/* 마크다운 콘텐츠를 HTML로 렌더링 */}
          <Streamdown mode="static">{policy.content}</Streamdown>
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
