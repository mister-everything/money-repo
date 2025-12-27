"use client";
import { NICKNAME_RULES, validateNickname } from "@service/auth/shared";

import { LoaderIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { recordConsentAction, updateProfileAction } from "@/actions/user";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { SetupImage } from "./setup-image";
import { SetupNickname } from "./setup-nickname";
import { PolicyVersion, SetupPolicy } from "./setup-policy";
import { SetupTheme } from "./setup-theme";

type Step = "nickname" | "image" | "theme" | "policy";

interface OnboardingProps {
  initialUserData?: { nickname?: string; image?: string };
  policies?: PolicyVersion[];
  steps?: Step[];
  initialStep?: Step;
  onComplete?: () => void;
}

export function Onboarding({
  initialUserData,
  policies = [],
  steps = ["nickname", "image", "theme", "policy"],
  initialStep,
  onComplete,
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>(
    initialStep ?? steps[0] ?? "nickname",
  );

  const [userData, setUserData] = useState<{
    nickname?: string;
    image?: string;
  }>(initialUserData ?? {});

  const [policyConsents, setPolicyConsents] = useState<Record<string, boolean>>(
    {},
  );

  const [, updateUserData, isUpdatingUserData] = useSafeAction(
    updateProfileAction,
    {
      onSuccess: () => {
        next();
      },
    },
  );

  const [, recordConsent, isRecordingConsent] = useSafeAction(
    recordConsentAction,
    {
      onSuccess: () => {
        next();
      },
    },
  );

  const nicknameFeedback = useMemo(() => {
    const validation = validateNickname(userData.nickname || "");
    if (!validation.valid) return validation.error;
    return null;
  }, [userData.nickname]);

  const requiredPolicies = useMemo(
    () => policies.filter((p) => p.isRequired),
    [policies],
  );

  const allRequiredPoliciesChecked = useMemo(
    () => requiredPolicies.every((p) => policyConsents[p.id]),
    [requiredPolicies, policyConsents],
  );

  const canNext = useMemo(() => {
    if (currentStep === "nickname") {
      return (
        userData.nickname?.length &&
        userData.nickname.length > 0 &&
        !nicknameFeedback
      );
    }
    if (currentStep === "image") {
      return userData.image?.length && userData.image.length > 0;
    }
    if (currentStep === "policy") {
      return allRequiredPoliciesChecked;
    }
    return true;
  }, [
    currentStep,
    userData.nickname,
    userData.image,
    nicknameFeedback,
    allRequiredPoliciesChecked,
  ]);

  const isLoading = useMemo(() => {
    return isUpdatingUserData || isRecordingConsent;
  }, [isUpdatingUserData, isRecordingConsent]);

  const next = useCallback(async () => {
    const nextStep = steps[steps.indexOf(currentStep) + 1];
    if (!nextStep) {
      onComplete?.();
      return;
    }
    setCurrentStep(nextStep);
  }, [currentStep, steps, onComplete]);

  const handleNextStep = useCallback(() => {
    if (
      currentStep == "nickname" &&
      userData.nickname !== initialUserData?.nickname
    ) {
      return updateUserData({ nickname: userData.nickname });
    } else if (
      currentStep == "image" &&
      userData.image !== initialUserData?.image
    ) {
      return updateUserData({ image: userData.image });
    } else if (currentStep === "policy") {
      // 동의한 정책들만 기록
      const consentsToRecord = Object.entries(policyConsents)
        .filter(([, isAgreed]) => isAgreed)
        .map(([policyVersionId]) => ({
          policyVersionId,
          isAgreed: true,
        }));

      if (consentsToRecord.length > 0) {
        return recordConsent(consentsToRecord);
      }
    }

    next();
  }, [
    next,
    currentStep,
    userData.nickname,
    userData.image,
    initialUserData?.nickname,
    initialUserData?.image,
    policyConsents,
    updateUserData,
    recordConsent,
  ]);

  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      {currentStep === "nickname" ? (
        <SetupNickname
          nickname={userData.nickname}
          feedback={
            userData.nickname?.length &&
            userData.nickname.length >= NICKNAME_RULES.minLength
              ? nicknameFeedback
              : undefined
          }
          onChangeNickname={(nickname) =>
            setUserData({ ...userData, nickname })
          }
        />
      ) : currentStep === "image" ? (
        <SetupImage
          image={userData.image}
          nickname={userData.nickname}
          onChangeImage={(image) => setUserData({ ...userData, image })}
        />
      ) : currentStep === "theme" ? (
        <SetupTheme />
      ) : currentStep === "policy" ? (
        <SetupPolicy
          policies={policies}
          consents={policyConsents}
          onConsentChange={setPolicyConsents}
        />
      ) : null}
      <Button
        disabled={!canNext || isLoading}
        variant={canNext ? "default" : "secondary"}
        className="w-full max-w-sm"
        onClick={handleNextStep}
      >
        {isLoading ? (
          <LoaderIcon className="animate-spin" />
        ) : steps.indexOf(currentStep) === steps.length - 1 ? (
          "시작하기"
        ) : (
          "다음"
        )}
      </Button>
      <div className="flex gap-2">
        {steps.map((step) => (
          <div
            className={cn(
              "w-8 h-2 rounded-full bg-input transition-all duration-300",
              currentStep === step ? "bg-primary" : "",
            )}
            onClick={() => setCurrentStep(step)}
            key={step}
          />
        ))}
      </div>
    </div>
  );
}
