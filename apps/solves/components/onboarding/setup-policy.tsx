"use client";

import { Policy, PolicyVersion } from "@service/auth/shared";
import { formatDate } from "date-fns";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { useMemo } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { GradualSpacingText } from "../ui/gradual-spacing-text";
import { Label } from "../ui/label";

interface SetupPolicyProps {
  policies: PolicyVersion[];
  consents: Record<string, boolean>;
  onConsentChange: (consents: Record<string, boolean>) => void;
}

export function SetupPolicy({
  policies,
  consents,
  onConsentChange,
}: SetupPolicyProps) {
  const requiredPolicies = useMemo(
    () => policies.filter((p) => p.isRequired),
    [policies],
  );
  const optionalPolicies = useMemo(
    () => policies.filter((p) => !p.isRequired),
    [policies],
  );

  const allRequiredChecked = useMemo(
    () => requiredPolicies.every((p) => consents[p.id]),
    [requiredPolicies, consents],
  );

  const allChecked = useMemo(
    () => policies.every((p) => consents[p.id]),
    [policies, consents],
  );

  const handleAllAgree = (checked: boolean) => {
    const newConsents = { ...consents };
    for (const policy of policies) {
      newConsents[policy.id] = checked;
    }
    onConsentChange(newConsents);
  };

  const handleConsentChange = (policyId: string, checked: boolean) => {
    onConsentChange({
      ...consents,
      [policyId]: checked,
    });
  };

  const getPolicyLabel = (type: string) => {
    return Policy.find((p) => p.value === type)?.label ?? type;
  };

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-2xl">
      {/* Title */}
      <div className="flex flex-col gap-2 justify-center items-center">
        <Label className="text-2xl font-semibold px-2">
          <GradualSpacingText text="서비스 이용약관에 동의해주세요" />
        </Label>
        <p className="text-sm text-muted-foreground fade-1000">
          원활한 서비스 이용을 위해 약관에 동의해주세요
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        {/* 전체 동의 */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 border rounded-lg transition-all duration-300 cursor-pointer",
            allChecked
              ? "bg-primary/5 border-primary"
              : "hover:bg-muted/50 hover:border-muted-foreground/30",
          )}
          onClick={() => handleAllAgree(!allChecked)}
        >
          <Checkbox
            id="all-agree"
            checked={allChecked}
            onCheckedChange={handleAllAgree}
          />
          <Label htmlFor="all-agree" className="font-semibold cursor-pointer">
            전체 동의
          </Label>
        </div>

        {/* 약관 목록 */}
        <div className="border rounded-lg flex flex-col">
          {/* 필수 약관 */}
          {[...requiredPolicies, ...optionalPolicies].map((policy, i) => (
            <PolicyItem
              key={policy.id}
              policy={policy}
              className={i != 0 ? "border-t" : ""}
              label={getPolicyLabel(policy.type)}
              checked={consents[policy.id] ?? false}
              onCheckedChange={(checked) =>
                handleConsentChange(policy.id, checked)
              }
            />
          ))}
        </div>

        {/* 필수 동의 안내 */}
        {!allRequiredChecked && requiredPolicies.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            필수 약관에 모두 동의해야 다음으로 진행할 수 있습니다
          </p>
        )}
      </div>
    </div>
  );
}

interface PolicyItemProps {
  policy: PolicyVersion;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

function PolicyItem({
  policy,
  label,
  checked,
  className,
  onCheckedChange,
}: PolicyItemProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            "px-4 flex items-center gap-2 hover:bg-muted/50 transition-all duration-300 cursor-pointer group",
            className,
          )}
        >
          <div className="flex items-center gap-3 py-2 mr-auto">
            <Checkbox
              id={policy.id}
              checked={checked}
              onCheckedChange={onCheckedChange}
              onClick={(e) => e.stopPropagation()}
            />
            <Badge
              variant={policy.isRequired ? "default" : "secondary"}
              className="text-xs rounded-full"
            >
              {policy.isRequired ? "필수" : "선택"}
            </Badge>

            <div className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{label}</span>
              </div>
            </div>
          </div>

          <ChevronRightIcon className="size-4 group-hover:text-foreground text-muted-foreground transition-all duration-300" />
        </div>
      </DialogTrigger>
      <DialogContent className="md:max-w-xl!">
        <div className="max-h-[80vh] overflow-y-auto pb-24">
          <DialogHeader>
            <DialogTitle>{`${label} v${policy.version}`}</DialogTitle>
            <DialogDescription>
              {formatDate(policy.effectiveAt, "시행일 yyyy년 M월 d일")}
            </DialogDescription>
          </DialogHeader>
          <Streamdown mode="static" className="text-xs text-muted-foreground">
            {policy.content}
          </Streamdown>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background">
          <DialogClose asChild>
            <Button
              size={"lg"}
              className="rounded-full w-full font-bold"
              onClick={() => onCheckedChange(true)}
            >
              <CheckIcon />
              동의 하기
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
