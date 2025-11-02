"use client";

import type { ProbBlock } from "@service/solves/shared";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProblemHistory } from "./problem-history";
import { DefaultCardContent } from "./problem-type-cards/default-card";
import { McqCardContent } from "./problem-type-cards/mcq-card";
import { OxCardContent } from "./problem-type-cards/ox-card";

interface ProblemCardProps {
  problem: ProbBlock;
  index: number;
  onEdit?: (problemId: string) => void;
  onDelete?: (problemId: string) => void;
  onView?: (problemId: string) => void;
}

export function ProblemCard({
  problem,
  index,
  onEdit,
  onDelete,
  onView,
}: ProblemCardProps) {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mcq: "객관식",
      default: "주관식",
      ox: "OX",
      ranking: "순위",
    };
    return labels[type] || type;
  };

  const renderContent = () => {
    if (problem.type === "mcq" && problem.content.type === "mcq") {
      return (
        <McqCardContent
          content={problem.content}
          answer={problem.answer?.type === "mcq" ? problem.answer : undefined}
        />
      );
    }
    if (problem.type === "ox" && problem.content.type === "ox") {
      return (
        <OxCardContent
          content={problem.content}
          answer={problem.answer?.type === "ox" ? problem.answer : undefined}
        />
      );
    }
    if (problem.type === "default") {
      return (
        <DefaultCardContent
          question={problem.question}
          answer={
            problem.answer?.type === "default" ? problem.answer : undefined
          }
        />
      );
    }
    return null;
  };

  return (
    <Card className="group relative overflow-hidden ">
      <div className="p-6 pt-0">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline" className="rounded-md">
                문제 {index + 1}
              </Badge>
              <Badge className="rounded-md">{getTypeLabel(problem.type)}</Badge>
            </div>
            <h3 className="text-lg font-medium text-foreground">
              {problem.question}
            </h3>
          </div>

          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView?.(problem.id)}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(problem.id)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete?.(problem.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {renderContent()}

        <ProblemHistory problemId={problem.id} />
      </div>
    </Card>
  );
}
