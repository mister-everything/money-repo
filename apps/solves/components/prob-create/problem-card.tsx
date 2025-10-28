"use client";

import type { ProbBlockWithoutAnswer } from "@service/solves/shared";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ProblemCardProps {
  problem: ProbBlockWithoutAnswer;
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
    };
    return labels[type] || type;
  };

  const renderContent = () => {
    if (problem.type === "mcq" && problem.content.type === "mcq") {
      return (
        <div className="mt-3 space-y-2">
          <div className="text-sm text-muted-foreground">선택 내역</div>
          <div className="space-y-1">
            {problem.content.options.map((option, idx) => (
              <div key={option.id} className="text-sm text-foreground">
                {idx + 1}.{" "}
                {option.type === "text" ? option.text : `${option.type} 파일`}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <div className="p-6">
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
      </div>
    </Card>
  );
}
