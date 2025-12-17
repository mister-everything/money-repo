import { getBlockDisplayName } from "@service/solves/shared";
import { AtSignIcon } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";
import { SolvesMentionItem } from "./types";

export function MentionItem({
  item,
  className,
}: {
  item: SolvesMentionItem;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-blue-500 flex items-center mx-1 px-1 bg-blue-500/5 rounded",
        className,
      )}
    >
      <AtSignIcon className="size-3" />
      {item.kind === "block" ? `문제${item.order}` : item.name}
    </div>
  );
}

export function MentionSuggestionItem({
  item,
  isSelected,
}: {
  item: SolvesMentionItem;
  isSelected?: boolean;
}) {
  const block = useMemo(() => {
    if (item.kind !== "block") return null;
    return useWorkbookEditStore.getState().blocks.find((b) => b.id === item.id);
  }, []);
  return (
    <div
      className={cn(
        "p-2 text-2xs flex items-center gap-2 cursor-pointer hover:bg-input max-w-sm",
        isSelected && "bg-input",
      )}
    >
      {item.kind === "block" ? (
        <>
          {" "}
          <Badge className="text-2xs w-12 truncate">문제 {item.order}</Badge>
          <Badge className="text-2xs w-16 truncate" variant="secondary">
            {getBlockDisplayName(item.blockType)}
          </Badge>
          <span className="truncate flex-1">{block?.question}</span>
        </>
      ) : (
        <p>지원되지 않는 멘션 타입입니다.</p>
      )}
    </div>
  );
}
