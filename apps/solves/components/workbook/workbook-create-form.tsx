"use client";

import { BlockDisplayName } from "@service/solves/shared";
import { errorToString } from "@workspace/util";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createWorkbookAction } from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { useWorkbookStore } from "@/store/prob-create";

export function WorkbookCreateForm() {
  const router = useRouter();
  const { setWorkbooks } = useWorkbookStore();

  const [, formAction, isPending] = useSafeAction(createWorkbookAction, {
    onSuccess: (result) => {
      setWorkbooks(result.id, formData);
      router.push(`/workbooks/${result.id}/edit`);
    },
    failMessage: errorToString,
    successMessage: "문제집 생성에 성공했습니다.",
  });

  const [formData, setFormData] = useState({
    topic: "전체",
    ageGroup: "성인",
    situation: "",
    format: [] as string[],
    difficulty: "",
  });

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-cols gap-1">
          <label className="text-sm font-medium text-foreground">소재</label>
          <span className="text-destructive text-sm">*</span>
        </div>
        <ButtonSelect
          value={formData.topic}
          onChange={(value) =>
            setFormData({ ...formData, topic: value as string })
          }
          name="topic"
          options={[
            { label: "전체", value: "전체" },
            { label: "일반상식", value: "일반상식" },
            { label: "학교 교과목", value: "학교 교과목" },
            { label: "시사", value: "시사" },
            { label: "역사/문화", value: "역사/문화" },
            { label: "영화/음악", value: "영화/음악" },
            { label: "업무/직무", value: "업무/직무" },
            { label: "MBTI/성향", value: "MBTI/성향" },
            { label: "밈/트렌드", value: "밈/트렌드" },
            { label: "라이프스타일", value: "라이프스타일" },
            { label: "과학/기술/IT", value: "과학/기술/IT" },
          ]}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-cols gap-1">
          <label className="text-sm font-medium text-foreground">연령대</label>
        </div>
        <ButtonSelect
          value={formData.ageGroup}
          onChange={(value) => {
            setFormData({ ...formData, ageGroup: value as string });
          }}
          name="ageGroup"
          options={[
            { label: "전체", value: "전체" },
            { label: "유아", value: "유아" },
            { label: "아동", value: "아동" },
            { label: "청소년", value: "청소년" },
            { label: "성인", value: "성인" },
            { label: "시니어", value: "시니어" },
          ]}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-cols gap-1">
          <label className="text-sm font-medium text-foreground">유형</label>
          <span className="text-destructive text-sm">*</span>
        </div>
        <ButtonSelect
          value={formData.format}
          multiple={true}
          onChange={(value) => {
            setFormData({ ...formData, format: value as string[] });
          }}
          name="format"
          options={Object.values(BlockDisplayName).map((value) => ({
            label: value,
            value: value,
          }))}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg py-6 text-base"
      >
        {isPending && <Loader className="size-4 animate-spin" />}
        문제 만들기
      </Button>
    </form>
  );
}
