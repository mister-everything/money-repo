"use client";

import { PolicyForm } from "@/components/solves/policy-form";
import { createPolicyAction } from "../actions";

export default function CreatePolicyPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 p-6">
        <div>
          <p className="text-muted-foreground">
            새로운 정책을 생성합니다. 정책은 한번 생성하면 수정하거나 삭제할 수
            없습니다.
          </p>
        </div>

        <PolicyForm action={createPolicyAction} />
      </div>
    </main>
  );
}

