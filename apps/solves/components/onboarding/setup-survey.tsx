"use client";

import {
  Occupations,
  OccupationType,
  ReferralSources,
  ReferralSourceType,
} from "@service/auth/shared";
import { cn } from "@/lib/utils";
import { GradualSpacingText } from "../ui/gradual-spacing-text";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface SetupSurveyProps {
  referralSource?: ReferralSourceType;
  occupation?: OccupationType;
  onChangeReferralSource: (value: ReferralSourceType) => void;
  onChangeOccupation: (value: OccupationType) => void;
}

export function SetupSurvey({
  referralSource,
  occupation,
  onChangeReferralSource,
  onChangeOccupation,
}: SetupSurveyProps) {
  return (
    <div className="flex flex-col gap-8 items-center w-full max-w-2xl">
      {/* Title */}
      <div className="flex flex-col gap-2 justify-center items-center">
        <Label className="text-2xl font-semibold px-2">
          <GradualSpacingText text="잠깐! 몇 가지만 여쭤볼게요" />
        </Label>
        <p className="text-sm text-muted-foreground fade-1000">
          더 나은 서비스를 위해 간단한 설문에 답해주세요
        </p>
      </div>

      {/* 유입 경로 */}
      <div className="flex flex-col gap-2">
        <Label className="text-base font-medium">
          <GradualSpacingText text="어떻게 알게 되셨나요?" />
        </Label>
        <RadioGroup
          value={referralSource}
          onValueChange={(v) => onChangeReferralSource(v as ReferralSourceType)}
          className="grid grid-cols-2 md:grid-cols-3 gap-2"
        >
          {ReferralSources.map((source) => (
            <Label
              key={source.value}
              htmlFor={`referral-${source.value}`}
              className={cn(
                "flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all duration-200",
                "hover:bg-primary/5 hover:border-primary/50 w-36 text-center",
                referralSource === source.value
                  ? "bg-primary/5 border-primary text-primary"
                  : "",
              )}
            >
              <RadioGroupItem
                value={source.value}
                id={`referral-${source.value}`}
              />
              <span className="text-sm">{source.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* 직업 */}
      <div className="flex flex-col gap-2">
        <Label className="text-base font-medium">
          <GradualSpacingText text="현재 하시는 일은 무엇인가요?" />
        </Label>
        <RadioGroup
          value={occupation}
          onValueChange={(v) => onChangeOccupation(v as OccupationType)}
          className="grid grid-cols-2 md:grid-cols-3 gap-2"
        >
          {Occupations.map((occ) => (
            <Label
              key={occ.value}
              htmlFor={`occupation-${occ.value}`}
              className={cn(
                "flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all duration-200",
                "hover:bg-primary/5 hover:border-primary/50 w-36 text-center",
                occupation === occ.value
                  ? "bg-primary/5 border-primary text-primary"
                  : "",
              )}
            >
              <RadioGroupItem
                value={occ.value}
                id={`occupation-${occ.value}`}
              />
              <span className="text-sm">{occ.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
