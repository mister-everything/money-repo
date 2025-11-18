"use client";

import { BlockDisplayName } from "@service/solves/shared";
import { errorToString } from "@workspace/util";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createWorkbookAction } from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { useWorkbookStore } from "@/store/prob-create";
import { OptionGroup } from "./option-group";

export function WorkbookCreateForm() {
  const router = useRouter();
  const { setWorkbooks } = useWorkbookStore();

  const [formAction, isPending] = useSafeAction(createWorkbookAction, {
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
      <OptionGroup
        label="소재"
        name="topic"
        options={[
          "전체",
          "일반상식",
          "학교 교과목",
          "시사",
          "역사/문화",
          "영화/음악",
          "업무/직무",
          "MBTI/성향",
          "밈/트렌드",
          "라이프스타일",
          "과학/기술/IT",
        ]}
        value={formData.topic}
        onValueChange={(value) =>
          setFormData({ ...formData, topic: value as string })
        }
        type="single"
        required={true}
      />

      <OptionGroup
        label="연령대"
        name="ageGroup"
        options={["전체", "유아", "아동", "청소년", "성인", "시니어"]}
        value={formData.ageGroup}
        onValueChange={(value) =>
          setFormData({ ...formData, ageGroup: value as string })
        }
        type="single"
        required={true}
      />

      <OptionGroup
        label="상황"
        name="situation"
        options={["친목", "콘텐츠", "교육"]}
        value={formData.situation}
        onValueChange={(value) =>
          setFormData({ ...formData, situation: value as string })
        }
      />

      <OptionGroup
        label="유형"
        name="format"
        options={Object.values(BlockDisplayName)}
        value={formData.format}
        onValueChange={(value) =>
          setFormData({ ...formData, format: value as string[] })
        }
        type="multiple"
      />

      <OptionGroup
        label="난이도"
        name="difficulty"
        options={["아주쉬움", "쉬움", "보통", "어려움", "아주어려움"]}
        value={formData.difficulty}
        onValueChange={(value) =>
          setFormData({ ...formData, difficulty: value as string })
        }
      />

      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg mt-10 py-6 text-base"
      >
        {isPending ? "문제집 생성 중..." : "문제 만들기"}
      </Button>
    </form>
  );
}
