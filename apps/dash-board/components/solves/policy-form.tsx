"use client";

import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { CreatePolicyInput } from "@/app/(dash-board)/solves/policies/actions";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { SafeFunction } from "@/lib/protocol/interface";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

interface PolicyFormProps {
  action: SafeFunction<CreatePolicyInput, any>;
}

const policyTypes = [
  { value: "terms", label: "서비스 이용약관" },
  { value: "privacy", label: "개인정보 처리방침" },
  { value: "community", label: "커뮤니티 가이드라인" },
  { value: "marketing", label: "마케팅 정보 수신 동의" },
] as const;

export function PolicyForm({ action }: PolicyFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  // Form states
  const [type, setType] = useState<CreatePolicyInput["type"]>("terms");
  const [version, setVersion] = useState("1.0.0");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [effectiveAt, setEffectiveAt] = useState<Date>(new Date());

  const [, executeAction, isPending] = useSafeAction(action, {
    onSuccess: () => {
      toast.success("정책이 생성되었습니다.");
      setErrors(null);
      router.push("/solves/policies");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "저장에 실패했습니다.");
      if (error.fields) {
        const filteredFields: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(error.fields)) {
          if (value) filteredFields[key] = value;
        }
        setErrors(filteredFields);
      }
    },
  });

  const handleSubmit = () => {
    executeAction({
      type,
      version,
      title,
      content,
      isRequired,
      effectiveAt,
    });
  };

  const hasFieldError = useMemo(() => {
    return Object.keys(errors ?? {}).length > 0;
  }, [errors]);

  const getFieldError = useCallback(
    (fieldName: string) => {
      return errors?.[fieldName]?.[0];
    },
    [errors],
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 정책 타입 */}
        <div className="grid gap-2">
          <Label htmlFor="type">정책 타입</Label>
          <Select
            value={type}
            onValueChange={(value) =>
              setType(value as CreatePolicyInput["type"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="정책 타입 선택" />
            </SelectTrigger>
            <SelectContent>
              {policyTypes.map((policyType) => (
                <SelectItem key={policyType.value} value={policyType.value}>
                  {policyType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFieldError && (
            <p className="text-sm text-destructive">{getFieldError("type")}</p>
          )}
        </div>

        {/* 버전 */}
        <div className="grid gap-2">
          <Label htmlFor="version">버전</Label>
          <Input
            id="version"
            placeholder="1.0.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
          {hasFieldError && (
            <p className="text-sm text-destructive">
              {getFieldError("version")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Semantic Versioning 형식 (예: 1.0.0)
          </p>
        </div>
      </div>

      {/* 제목 */}
      <div className="grid gap-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          placeholder="서비스 이용약관"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {hasFieldError && (
          <p className="text-sm text-destructive">{getFieldError("title")}</p>
        )}
      </div>

      {/* 내용 */}
      <div className="grid gap-2">
        <Label htmlFor="content">내용 (마크다운)</Label>
        <Textarea
          id="content"
          placeholder="정책 내용을 마크다운 형식으로 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="font-mono text-sm"
        />
        {hasFieldError && (
          <p className="text-sm text-destructive">{getFieldError("content")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 시행일 */}
        <div className="grid gap-2">
          <Label>시행일</Label>
          <DatePicker
            date={effectiveAt}
            onDateChange={(date) => setEffectiveAt(date ?? new Date())}
          />
          {hasFieldError && (
            <p className="text-sm text-destructive">
              {getFieldError("effectiveAt")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            정책이 효력을 갖는 시작일입니다.
          </p>
        </div>

        {/* 필수 여부 */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 h-fit">
          <div className="space-y-0.5">
            <Label htmlFor="isRequired" className="text-base">
              필수 동의 항목
            </Label>
            <p className="text-sm text-muted-foreground">
              서비스 이용을 위해 반드시 동의해야 하는 항목입니다.
            </p>
          </div>
          <Switch
            id="isRequired"
            checked={isRequired}
            onCheckedChange={setIsRequired}
          />
        </div>
      </div>

      {/* 안내 */}
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          ⚠️ 정책은 한번 생성하면 수정하거나 삭제할 수 없습니다. 법적 증빙을 위해
          모든 버전이 보관됩니다.
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/solves/policies")}
        >
          취소
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending ? <Loader className="size-4 animate-spin" /> : "정책 생성"}
        </Button>
      </div>
    </div>
  );
}
