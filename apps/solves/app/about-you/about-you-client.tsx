"use client";

import { PolicyVersion } from "@service/auth/shared";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Onboarding } from "@/components/onboarding/onboarding";
import { Step } from "@/components/onboarding/types";
import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
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
    router.push(callbackUrl || "/");
    router.refresh();
  }, [callbackUrl, router, refetch]);

  return (
    <div className="w-full h-screen flex items-center justify-center relative">
      <h1 className="absolute top-0 left-0 text-lg p-4 font-bold z-10">
        <GradualSpacingText text="Solves" />
        <span className="text-lg text-primary">.</span>
      </h1>

      <div className="absolute top-0 left-0 w-full h-full ">
        <div className="w-full h-full bg-linear-to-b from-background to-50% to-transparent z-20" />
      </div>
      <div className="absolute top-0 left-0 w-full h-full ">
        <div className="w-full h-full bg-linear-to-t from-background to-50% to-transparent z-20" />
      </div>
      <div className="absolute top-0 left-0 w-full h-full ">
        <div className="w-full h-full bg-linear-to-l from-background to-20% to-transparent z-20" />
      </div>
      <div className="absolute top-0 left-0 w-full h-full ">
        <div className="w-full h-full bg-linear-to-r from-background to-20% to-transparent z-20" />
      </div>

      <div className="z-10">
        <Onboarding
          steps={steps}
          policies={policies}
          initialUserData={initialUserData}
          onComplete={handleOnComplete}
        />
      </div>
    </div>
  );
}
