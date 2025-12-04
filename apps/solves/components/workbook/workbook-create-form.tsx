"use client";

import {
  blockDisplayNames,
  MAX_INPROGRESS_WORKBOOK_CREATE_COUNT,
} from "@service/solves/shared";
import { errorToString } from "@workspace/util";
import { Loader, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createWorkbookAction } from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { useWorkbookStore } from "@/store/workbook-create";

export function WorkbookCreateForm({
  isMaxInprogressWorkbookCreateCount = false,
}: {
  isMaxInprogressWorkbookCreateCount?: boolean;
}) {
  const router = useRouter();
  const { setWorkbooks } = useWorkbookStore();

  const [, formAction, isPending] = useSafeAction(createWorkbookAction, {
    onSuccess: (result) => {
      setWorkbooks(result.id, formData);
      router.push(`/workbooks/${result.id}/edit`);
    },
    failMessage: errorToString,
    successMessage: "문제집 페이지로 이동합니다.",
  });

  const [formData, setFormData] = useState({
    topic: "전체",
    ageGroup: "성인",
    situation: "",
    format: [] as string[],
    difficulty: "",
  });

  return (
    <div className="w-full">
      <div className="flex justify-start items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          어떤 문제집을 만들고 싶나요?
        </h1>
        {!isMaxInprogressWorkbookCreateCount && (
          <p className="text-xs text-point">
            (* 한 문제집은 총 10개의 문제로 구성돼요)
          </p>
        )}
      </div>

      <form action={formAction} className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <label className="text-sm font-bold text-foreground">소재</label>
            {!isMaxInprogressWorkbookCreateCount && (
              <>
                <TriangleAlertIcon className="size-2.5 text-background fill-point ml-2" />
                <span className="text-point text-xs">
                  소재는 문제집 생성 후 변경할 수 없으니 신중하게 선택해주세요
                </span>
              </>
            )}
          </div>
          <ButtonSelect
            disabled={isMaxInprogressWorkbookCreateCount}
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
            <label className="text-sm font-bold text-foreground">연령대</label>
          </div>
          <ButtonSelect
            disabled={isMaxInprogressWorkbookCreateCount}
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
            <label className="text-sm font-bold text-foreground">유형</label>
          </div>
          <ButtonSelect
            disabled={isMaxInprogressWorkbookCreateCount}
            value={formData.format}
            multiple={true}
            onChange={(value) => {
              setFormData({ ...formData, format: value as string[] });
            }}
            name="format"
            options={Object.values(blockDisplayNames).map((value) => ({
              label: value,
              value: value,
            }))}
          />
        </div>

        <Button
          type="submit"
          variant={isMaxInprogressWorkbookCreateCount ? "secondary" : "default"}
          disabled={isPending || isMaxInprogressWorkbookCreateCount}
          className={cn(
            "w-full rounded-lg py-6 text-base",
            isMaxInprogressWorkbookCreateCount &&
              "border-dashed shadow-none py-8",
          )}
        >
          {isPending && <Loader className="size-4 animate-spin" />}
          {isMaxInprogressWorkbookCreateCount ? (
            <div className="space-y-2">
              <p className="text-center text-muted-foreground text-sm">
                아직 완성되지 않은 문제집이 있어요. 완성되지 않은 문제집은 최대{" "}
                {MAX_INPROGRESS_WORKBOOK_CREATE_COUNT}개까지 생성할 수 있어요.
              </p>
              <p className="text-center text-muted-foreground text-sm">
                아래 문제집을 <span className="text-point ">완성</span>하거나{" "}
                <span className="text-point ">삭제</span>하면 문제집을{" "}
                <span className="text-point font-semibold">생성</span>할 수
                있어요.
              </p>
            </div>
          ) : (
            "문제 만들기"
          )}
        </Button>
      </form>
    </div>
  );
}
