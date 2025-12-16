import { getBlockDisplayName } from "@service/solves/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SolvesMentionItem } from "./types";

export function MentionItem({ item }: { item: SolvesMentionItem }) {
  if (item.kind === "block") {
    return (
      <Badge
        className="text-2xs mx-0.5 flex items-center gap-1 px-1"
        variant="secondary"
      >
        <div className="text-3xs bg-foreground text-background rounded size-3 flex items-center justify-center">
          {item.order}
        </div>
        {getBlockDisplayName(item.blockType)} 문제
      </Badge>
    );
  }
  return (
    <p className="text-muted-foreground">지원되지 않는 멘션 타입입니다.</p>
  );
}

export function MentionInputItem({ item }: { item: SolvesMentionItem }) {
  return (
    <div
      className={cn(
        "text-sele mx-1 rounded-full bg-primary/10 p-1 text-2xs flex items-center gap-2 cursor-pointer hover:ring-1 ring-primary max-w-48",
      )}
    >
      {item.kind === "block" ? (
        <>
          <Badge className="text-3xs rounded-full" variant="default">
            문제 {item.order}
          </Badge>
          <span className="flex-1 truncate">{item.question}</span>
        </>
      ) : (
        <p>지원되지 않는 멘션 타입입니다.</p>
      )}
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
          <Badge className="text-2xs w-12 truncate" variant="secondary">
            {getBlockDisplayName(item.blockType)}
          </Badge>
          <span className="flex-1 truncate">{item.question}</span>
        </>
      ) : (
        <p>지원되지 않는 멘션 타입입니다.</p>
      )}
    </div>
  );
}
