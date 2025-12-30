import { policyService, userService } from "@service/auth";
import { redirect } from "next/navigation";
import { Step } from "@/components/onboarding/types";
import { getSession } from "@/lib/auth/server";
import { AboutYouClient } from "./about-you-client";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ steps?: string; callbackUrl?: string }>;
}) {
  const { steps, callbackUrl } = await searchParams;

  const stepsArray: Step[] = (steps?.split(",") as Step[]) ?? [
    Step.NICKNAME,
    Step.IMAGE,
    Step.THEME,
    Step.SURVEY,
    Step.POLICY,
  ];

  const session = await getSession();

  const valid = await userService.exists(session.user.id);
  if (!valid) redirect("/sign-in");

  const initialUserData = {
    nickname: session.user.nickname ?? "",
    image: session.user.image ?? "",
    referralSource: session.user.referralSource ?? "",
    occupation: session.user.occupation ?? "",
  };

  const policies = stepsArray.includes(Step.POLICY)
    ? await policyService.getLatestPoliciesForOnboarding()
    : [];

  return (
    <AboutYouClient
      steps={stepsArray}
      policies={policies}
      initialUserData={initialUserData}
      callbackUrl={callbackUrl}
    />
  );
}
