"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OptionGroup } from "./option-group";

interface ProbCreateFormData {
  people: string;
  situation: string;
  format: string;
  platform: string;
  ageGroup: string;
  topic: string[];
  difficulty: string;
  description: string;
}

interface ProbCreateFormProps {
  onSubmit?: (data: ProbCreateFormData) => void;
}

export function ProbCreateForm({ onSubmit }: ProbCreateFormProps) {
  const [formData, setFormData] = useState<ProbCreateFormData>({
    people: "3인 이상",
    situation: "진득",
    format: "OX개입",
    platform: "하이브리드",
    ageGroup: "성인",
    topic: ["일반상식"],
    difficulty: "보통",
    description: "",
  });

  const handleSubmit = () => {
    onSubmit?.(formData);
  };

  return (
    <div className="space-y-6">
      <OptionGroup
        label="인원"
        options={["1인", "2인", "3인 이상"]}
        value={formData.people}
        onValueChange={(value) =>
          setFormData({ ...formData, people: value as string })
        }
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
        label="형식"
        options={["객관식", "주관식", "OX 게임", "날말퀴즈", "이미지/오디오"]}
        value={formData.format}
        onValueChange={(value) =>
          setFormData({ ...formData, format: value as string })
        }
      />

      <OptionGroup
        label="플랫폼"
        options={["온라인", "오프라인", "하이브리드"]}
        value={formData.platform}
        onValueChange={(value) =>
          setFormData({ ...formData, platform: value as string })
        }
      />

      <OptionGroup
        label="연령대"
        options={["유아", "아동", "청소년", "성인", "시니어"]}
        value={formData.ageGroup}
        onValueChange={(value) =>
          setFormData({ ...formData, ageGroup: value as string })
        }
      />

      <OptionGroup
        label="소재"
        options={[
          "일반상식",
          "시사",
          "영화/음악",
          "브랜드",
          "MBTI/성향",
          "업무",
          "밈/트렌드",
        ]}
        value={formData.topic}
        onValueChange={(value) =>
          setFormData({ ...formData, topic: value as string[] })
        }
        type="multiple"
      />

      <OptionGroup
        label="난이도"
        options={["아주쉬움", "쉬움", "보통", "어려움", "아주어려움"]}
        value={formData.difficulty}
        onValueChange={(value) =>
          setFormData({ ...formData, difficulty: value as string })
        }
      />

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          더 정확한 문제 생성을 위해 구체적으로 설명해주세요
        </label>
        <Textarea
          placeholder="예: 중학교 3학년 수학 문제집을 만들어주는데, 아이가 풀 때 지루함이 없게 중간 중간에 환기시켜줄만한 문제를 넣어주고 어쩌구 저쩌구 "
          className="min-h-[200px] resize-none"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full rounded-lg py-6 text-base"
      >
        문제 만들기
      </Button>
    </div>
  );
}
