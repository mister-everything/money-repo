"use client";
import {
  NICKNAME_RULES,
  OccupationType,
  PolicyVersion,
  ReferralSourceType,
  validateNickname,
} from "@service/auth/shared";
import { wait } from "@workspace/util";
import confetti from "canvas-confetti";
import { LoaderIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { recordConsentAction, updateProfileAction } from "@/actions/user";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { SetupImage } from "./setup-image";
import { SetupNickname } from "./setup-nickname";
import { SetupPolicy } from "./setup-policy";
import { SetupSurvey } from "./setup-survey";
import { SetupTheme } from "./setup-theme";
import { Step } from "./types";

interface OnboardingProps {
  initialUserData?: { nickname?: string; image?: string };
  policies?: PolicyVersion[];
  steps?: Step[];
  initialStep?: Step;
  onComplete?: () => void | Promise<void>;
}

export function Onboarding({
  initialUserData,
  policies = [],
  steps = [Step.NICKNAME, Step.IMAGE, Step.THEME, Step.SURVEY, Step.POLICY],
  initialStep,
  onComplete,
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>(
    initialStep ?? steps[0] ?? Step.NICKNAME,
  );

  const [complated, setComplated] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [userData, setUserData] = useState<{
    nickname?: string;
    image?: string;
  }>(initialUserData ?? {});

  const [surveyData, setSurveyData] = useState<{
    referralSource?: ReferralSourceType;
    occupation?: OccupationType;
  }>({});

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
    if (currentStep === "survey") {
      return surveyData.referralSource && surveyData.occupation;
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
    surveyData.referralSource,
    surveyData.occupation,
    allRequiredPoliciesChecked,
  ]);

  const isLoading = useMemo(() => {
    return isUpdatingUserData || isRecordingConsent;
  }, [isUpdatingUserData, isRecordingConsent]);

  const triggerConfetti = useCallback(async () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    const colors = ["#ff6b9d", "#c084fc", "#60a5fa", "#34d399", "#fbbf24"];
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x, y },
      colors,
      scalar: 0.8,
      gravity: 0.8,
      ticks: 500,
    });
    await wait(2000);
  }, []);

  const next = useCallback(async () => {
    const nextStep = steps[steps.indexOf(currentStep) + 1];
    if (!nextStep) {
      await triggerConfetti();
      await onComplete?.();
      setComplated(true);
      return;
    }
    setCurrentStep(nextStep);
  }, [currentStep, steps, onComplete]);

  const handleNextStep = useCallback(() => {
    if (
      currentStep == Step.NICKNAME &&
      userData.nickname !== initialUserData?.nickname
    ) {
      return updateUserData({ nickname: userData.nickname });
    } else if (
      currentStep == Step.IMAGE &&
      userData.image !== initialUserData?.image
    ) {
      return updateUserData({ image: userData.image });
    } else if (currentStep === Step.SURVEY) {
      // 설문 데이터 저장
      if (surveyData.referralSource || surveyData.occupation) {
        return updateUserData({
          referralSource: surveyData.referralSource,
          occupation: surveyData.occupation,
        });
      }
    } else if (currentStep === Step.POLICY) {
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
    surveyData.referralSource,
    surveyData.occupation,
    policyConsents,
    updateUserData,
    recordConsent,
  ]);

  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      {currentStep === Step.NICKNAME ? (
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
      ) : currentStep === Step.IMAGE ? (
        <SetupImage
          image={userData.image}
          nickname={userData.nickname}
          onChangeImage={(image) => setUserData({ ...userData, image })}
        />
      ) : currentStep === Step.THEME ? (
        <SetupTheme />
      ) : currentStep === Step.SURVEY ? (
        <SetupSurvey
          referralSource={surveyData.referralSource}
          occupation={surveyData.occupation}
          onChangeReferralSource={(referralSource) =>
            setSurveyData({ ...surveyData, referralSource })
          }
          onChangeOccupation={(occupation) =>
            setSurveyData({ ...surveyData, occupation })
          }
        />
      ) : currentStep === Step.POLICY ? (
        <SetupPolicy
          policies={policies}
          consents={policyConsents}
          onConsentChange={setPolicyConsents}
        />
      ) : null}
      <Button
        ref={buttonRef}
        disabled={!canNext || isLoading || complated}
        variant={canNext ? "default" : "secondary"}
        className="w-full max-w-sm fade-1000"
        onClick={handleNextStep}
      >
        {isLoading ? (
          <LoaderIcon className="animate-spin" />
        ) : steps.indexOf(currentStep) === steps.length - 1 ? (
          currentStep === Step.POLICY ? (
            "시작 하기"
          ) : (
            "완료"
          )
        ) : (
          "다음"
        )}
      </Button>
      {steps.length > 1 && (
        <div className="flex gap-2 fade-1000">
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
      )}
    </div>
  );
}
