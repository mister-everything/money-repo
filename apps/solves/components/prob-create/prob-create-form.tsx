"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OptionGroup } from "./option-group";

interface ProbCreateFormData {
  topic: string[];
  ageGroup: string[];

  situation: string;
  format: string;
  difficulty: string;
}

interface ProbCreateFormProps {
  onSubmit?: (data: ProbCreateFormData) => void;
}

export function ProbCreateForm({ onSubmit }: ProbCreateFormProps) {
  const [formData, setFormData] = useState<ProbCreateFormData>({
    topic: ["전체"],
    ageGroup: ["성인"],

    situation: "",
    format: "",
    difficulty: "",
  });

  const handleSubmit = () => {
    onSubmit?.(formData);
  };

  return (
    <div className="space-y-6">
      <OptionGroup
        label="소재"
        options={[
          "전체",
          "일반싱식",
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
          setFormData({ ...formData, topic: value as string[] })
        }
        type="multiple"
        required={true}
      />

      <OptionGroup
        label="연령대"
        options={["전체", "유아", "아동", "청소년", "성인", "시니어"]}
        value={formData.ageGroup}
        onValueChange={(value) =>
          setFormData({ ...formData, ageGroup: value as string[] })
        }
        required={true}
      />

      <OptionGroup
        label="상황"
        options={["친목", "콘텐츠", "교육"]}
        value={formData.situation}
        onValueChange={(value) =>
          setFormData({ ...formData, situation: value as string })
        }
      />

      <OptionGroup
        label="유형"
        options={["객관식", "주관식", "OX게임", "날말퀴즈", "이미지/오디오"]}
        value={formData.format}
        onValueChange={(value) =>
          setFormData({ ...formData, format: value as string })
        }
      />

      <OptionGroup
        label="난이도"
        options={["아주쉬움", "쉬움", "보통", "어려움", "아주어려움"]}
        value={formData.difficulty}
        onValueChange={(value) =>
          setFormData({ ...formData, difficulty: value as string })
        }
      />

      <Button
        onClick={handleSubmit}
        className="w-full rounded-lg mt-10 py-6 text-base"
      >
        문제 만들기
      </Button>
    </div>
  );
}
