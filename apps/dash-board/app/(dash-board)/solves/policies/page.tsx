import { policyService } from "@service/auth";
import { Plus } from "lucide-react";
import Link from "next/link";

import { PolicyTable } from "@/components/solves/policy-table";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const policies = await policyService.getAllPolicyVersions().catch((e) => {
    logger.error(e);
    return [];
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground mt-1">
            서비스 이용약관, 개인정보 처리방침 등 정책을 관리합니다.
          </p>
        </div>
        <Link href="/solves/policies/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />새 정책 추가
          </Button>
        </Link>
      </div>

      <PolicyTable policies={policies} />
    </main>
  );
}

