"use client";
import { NICKNAME_RULES, validateNickname } from "@service/auth/shared";

import { LoaderIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { SetupImage } from "./setup-image";
import { SetupNickname } from "./setup-nickname";
import { SetupTheme } from "./setup-theme";

type Step = "nickname" | "image" | "theme" | "policy";

interface OnboardingProps {
  initialUserData?: { nickname?: string; image?: string };
  steps?: Step[];
  initialStep?: Step;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function Onboarding({
  initialUserData,
  steps = ["nickname", "image", "theme", "policy"],
  initialStep,
  onComplete,
  isLoading = false,
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>(
    initialStep ?? steps[0] ?? "nickname",
  );

  const [userData, setUserData] = useState<{
    nickname?: string;
    image?: string;
  }>(initialUserData ?? {});

  const nicknameFeedback = useMemo(() => {
    const validation = validateNickname(userData.nickname || "");
    if (!validation.valid) return validation.error;
    return null;
  }, [userData.nickname]);

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
    return true;
  }, [currentStep, userData.nickname, userData.image, nicknameFeedback]);

  const handleNext = useCallback(async () => {
    const nextStep = steps[steps.indexOf(currentStep) + 1];
    if (!nextStep) {
      onComplete?.();
      return;
    }
    setCurrentStep(nextStep);
  }, [currentStep, steps, userData.nickname, nicknameFeedback]);

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
      ) : null}
      <Button
        disabled={!canNext}
        variant={canNext ? "default" : "secondary"}
        className="w-full max-w-sm"
        onClick={handleNext}
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
