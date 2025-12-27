"use client";

import { PolicyVersion } from "@service/auth/shared";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Onboarding } from "@/components/onboarding/onboarding";
import { Step } from "@/components/onboarding/types";
import { authClient } from "@/lib/auth/client";

export function AboutYouClient({
  steps,
  policies,
  callbackUrl,
  initialUserData,
}: {
  steps: Step[];
  policies?: PolicyVersion[];
  initialUserData?: {
    nickname?: string;
    image?: string;
    referralSource?: string;
    occupation?: string;
  };
  callbackUrl?: string;
}) {
  const router = useRouter();
  const { refetch } = authClient.useSession();

  const handleOnComplete = useCallback(async () => {
    await refetch();
    console.log(`router:`);
    router.push(callbackUrl || "/");
    router.refresh();
  }, [callbackUrl, router, refetch]);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Onboarding
        steps={steps}
        policies={policies}
        initialUserData={initialUserData}
        onComplete={handleOnComplete}
      />
    </div>
  );
}
