"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type BlockType, getBlockDisplayName } from "@service/solves/shared";
import { GripVerticalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BlockReorderItemProps {
  id: string;
  question: string;
  type: BlockType;
  index: number;
}

export function BlockReorderItem({
  id,
  question,
  type,
  index,
}: BlockReorderItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayName = getBlockDisplayName(type);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "shadow-none cursor-grab active:cursor-grabbing transition-all",
        "hover:border-primary/50 hover:shadow-sm",
        isDragging && "opacity-40 shadow-md",
      )}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div className="text-muted-foreground hover:text-foreground transition-colors">
            <GripVerticalIcon className="size-5" />
          </div>

          {/* Problem Number Badge */}
          <Badge variant="default">문제 {index + 1}</Badge>

          {/* Block Type Badge */}
          <Badge variant="secondary">{displayName}</Badge>

          {/* Question Text */}
          <div className="flex-1 min-w-0 ml-2">
            <p className="text-sm font-medium line-clamp-1 text-muted-foreground">
              {question || "문제 제목 없음"}
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
