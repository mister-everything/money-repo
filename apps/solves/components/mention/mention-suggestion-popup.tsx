import { SearchIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { MentionSuggestionItem } from "./mention-item";
import { SolvesMentionItem } from "./types";
export function MentionSuggestion({
  onSelectMention,
  onClose,
  top,
  items,
  left,
  width,
}: {
  top: number;
  left: number;
  onClose: () => void;
  items: (searchValue: string) => SolvesMentionItem[];
  onSelectMention: (item: SolvesMentionItem) => void;
  width?: number;
}) {
  const isMobile = useIsMobile();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
    },
    [],
  );

  const filteredItems = useMemo(() => {
    return items(searchValue);
  }, [items, searchValue]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !e.currentTarget.value) {
        return onClose();
      }
      if (e.key === "Enter" && filteredItems.length > 0) {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) {
          onSelectMention(item);
        }
        return onClose();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0,
        );
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1,
        );
      }
    },
    [onSelectMention, filteredItems, selectedIndex],
  );

  const trigger = useMemo(() => {
    return (
      <span
        className="fixed z-50"
        style={{
          width: width,
          top,
          left,
        }}
      ></span>
    );
  }, [top, left]);

  return (
    <Popover
      open={true}
      onOpenChange={(f) => {
        !f && onClose();
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="p-0 min-w-sm text-sm"
        align="start"
        side="top"
        style={{
          width: isMobile ? "100%" : "auto",
        }}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2 p-2 border-b">
            <SearchIcon className="size-3 shrink-0 opacity-50" />
            <input
              className="flex h-6 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={"방향키와 엔터키로 선택할 수 있습니다."}
              value={searchValue}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
          </div>
          <div
            className={cn(
              "overflow-hidden",
              isMobile ? "max-h-[50vh]" : "min-h-[100px]",
            )}
          >
            {filteredItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8 h-full">
                <div className="text-center">
                  <div className="text-xs opacity-60">
                    {!searchValue
                      ? "검색 결과가 없습니다."
                      : `"${searchValue}"에 대한 검색 결과가 없습니다.`}
                  </div>
                </div>
              </div>
            ) : (
              // Mobile vertical layout
              <div className="overflow-y-auto max-h-[50vh]">
                <div className="flex flex-col">
                  {filteredItems.map((item, i) => (
                    <div key={i} onClick={() => onSelectMention(item)}>
                      <MentionSuggestionItem
                        item={item}
                        isSelected={selectedIndex === i}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
