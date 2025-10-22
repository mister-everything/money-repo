"use client";

import type { SubscriptionPlanWithCount } from "@service/solves/shared";
import { AlertTriangle, Loader, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/notify";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type PlanContentBlock = {
  type: "text";
  text: string;
};

interface PlanFormProps {
  mode: "create" | "edit";
  initialData?: SubscriptionPlanWithCount;
  action: (
    prevState: any,
    formData: FormData,
  ) => Promise<{ success: boolean; errors?: any; message?: string }>;
  onDelete?: () => Promise<void>;
}

export function PlanForm({
  mode,
  initialData,
  action,
  onDelete,
}: PlanFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [plans, setPlans] = useState<PlanContentBlock[]>(
    initialData?.plans ?? [],
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // 에러 또는 성공 메시지 토스트
  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const handleAddPlan = () => {
    setPlans([...plans, { type: "text", text: "" }]);
  };

  const handleRemovePlan = (index: number) => {
    setPlans(plans.filter((_, i) => i !== index));
  };

  const handlePlanTextChange = (index: number, text: string) => {
    const newPlans = [...plans];
    newPlans[index] = { type: "text", text };
    setPlans(newPlans);
  };

  const handleToggleActiveWithConfirm = async (checked: boolean) => {
    const confirmed = await notify.confirm({
      title: checked ? "플랜 활성화" : "플랜 비활성화",
      description: checked
        ? "이 플랜을 활성화하시겠습니까?"
        : "이 플랜을 비활성화하시겠습니까? 비활성화된 플랜은 신규 구독이 불가능합니다.",
      okText: checked ? "활성화" : "비활성화",
      cancelText: "취소",
    });

    if (confirmed && onDelete) {
      try {
        setIsActive(checked);
        await onDelete();
        toast.success(
          checked ? "플랜이 활성화되었습니다." : "플랜이 비활성화되었습니다.",
        );
      } catch (error) {
        // 에러 발생 시 원래 상태로 되돌림
        setIsActive(!checked);
        toast.error(
          error instanceof Error ? error.message : "작업에 실패했습니다.",
        );
      }
    }
  };

  const getFieldError = (fieldName: string) => {
    return state?.errors?.[fieldName]?.[0];
  };

  return (
    <form action={formAction} className="space-y-8">
      {/* plans 배열을 hidden input으로 전송 */}
      <input type="hidden" name="plans" value={JSON.stringify(plans)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 플랜 식별자 */}
        <div className="grid gap-2">
          <Label htmlFor="name">플랜 식별자</Label>
          <Input
            id="name"
            name="name"
            placeholder="free, pro, business"
            defaultValue={initialData?.name}
            disabled={mode === "edit"}
            required
          />
          {getFieldError("name") && (
            <p className="text-sm text-destructive">{getFieldError("name")}</p>
          )}
          <p className="text-sm text-muted-foreground">
            시스템 내부에서 사용되는 고유 키입니다.
          </p>
        </div>

        {/* 플랜 표시명 */}
        <div className="grid gap-2">
          <Label htmlFor="displayName">플랜 표시명</Label>
          <Input
            id="displayName"
            name="displayName"
            placeholder="Free Plan"
            defaultValue={initialData?.displayName}
            required
          />
          {getFieldError("displayName") && (
            <p className="text-sm text-destructive">
              {getFieldError("displayName")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            사용자에게 보이는 플랜 이름입니다.
          </p>
        </div>
      </div>

      {/* 플랜 설명 */}
      <div className="grid gap-2">
        <Label htmlFor="description">플랜 설명</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="간단한 플랜 소개를 입력하세요"
          defaultValue={initialData?.description ?? ""}
          rows={3}
          className="resize-none"
        />
        {getFieldError("description") && (
          <p className="text-sm text-destructive">
            {getFieldError("description")}
          </p>
        )}
      </div>

      {/* 가격 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="price">월 구독료 (원)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            defaultValue={initialData?.price ?? "0.00"}
            required
          />
          {getFieldError("price") && (
            <p className="text-sm text-destructive">{getFieldError("price")}</p>
          )}
          <p className="text-sm text-muted-foreground">
            원화 기준 월 구독료입니다.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="monthlyQuota">월간 크레딧 할당량</Label>
          <Input
            id="monthlyQuota"
            name="monthlyQuota"
            type="number"
            step="0.01"
            placeholder="1000.00"
            defaultValue={initialData?.monthlyQuota ?? "0.00"}
            required
          />
          {getFieldError("monthlyQuota") && (
            <p className="text-sm text-destructive">
              {getFieldError("monthlyQuota")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            매월 초에 지급되는 크레딧입니다.
          </p>
        </div>
      </div>

      {/* 자동 충전 설정 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="refillAmount">자동 충전량</Label>
          <Input
            id="refillAmount"
            name="refillAmount"
            type="number"
            step="0.01"
            placeholder="50.00"
            defaultValue={initialData?.refillAmount ?? "0.00"}
            required
          />
          {getFieldError("refillAmount") && (
            <p className="text-sm text-destructive">
              {getFieldError("refillAmount")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            잔액 소진 시 충전 크레딧
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="refillIntervalHours">충전 간격 (시간)</Label>
          <Input
            id="refillIntervalHours"
            name="refillIntervalHours"
            type="number"
            placeholder="6"
            defaultValue={initialData?.refillIntervalHours ?? 6}
            required
          />
          {getFieldError("refillIntervalHours") && (
            <p className="text-sm text-destructive">
              {getFieldError("refillIntervalHours")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            마지막 충전 후 대기 시간
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="maxRefillCount">월간 최대 충전 횟수</Label>
          <Input
            id="maxRefillCount"
            name="maxRefillCount"
            type="number"
            placeholder="10"
            defaultValue={initialData?.maxRefillCount ?? 0}
            required
          />
          {getFieldError("maxRefillCount") && (
            <p className="text-sm text-destructive">
              {getFieldError("maxRefillCount")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            한 달 최대 자동 충전 횟수
          </p>
        </div>
      </div>

      {/* 플랜 상세 내용 */}
      <div className="space-y-4">
        <div>
          <Label>플랜 상세 내용</Label>
          <p className="text-sm text-muted-foreground mt-1">
            플랜의 세부 특징을 추가할 수 있습니다.
          </p>
        </div>

        {plans.map((plan, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Input
              placeholder="특징을 입력하세요"
              value={plan.text}
              onChange={(e) => handlePlanTextChange(index, e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemovePlan(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={handleAddPlan}
        >
          <Plus className="h-4 w-4 mr-2" />
          항목 추가
        </Button>
      </div>

      {/* Create mode: simple switch */}
      {mode === "create" && (
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="isActive" className="text-base">
              플랜 활성화
            </Label>
            <p className="text-sm text-muted-foreground">
              비활성 플랜은 신규 구독이 불가능합니다.
            </p>
          </div>
          <input type="hidden" name="isActive" value={String(isActive)} />
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      )}

      {mode === "edit" && onDelete && (
        <Alert className="bg-primary/5 border-primary text-primary">
          <AlertTriangle />
          <AlertTitle className="text-primary font-bold">
            플랜 비활성화 주의사항
          </AlertTitle>
          <AlertDescription className="w-full ">
            <div className="space-y-3 w-full">
              <p className="text-muted-foreground">
                플랜을 비활성화하면 신규 구독이 불가능합니다. 변경 전 반드시
                확인하세요.
              </p>

              <div className="flex w-full justify-end">
                <Switch
                  className="ml-auto"
                  checked={isActive}
                  onCheckedChange={handleToggleActiveWithConfirm}
                />
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end pt-6 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader className="size-4 animate-spin" />
          ) : mode === "create" ? (
            "플랜 생성"
          ) : (
            "플랜 수정"
          )}
        </Button>
      </div>
    </form>
  );
}
