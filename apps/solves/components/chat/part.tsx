import { truncateString } from "@workspace/util";
import { TextUIPart } from "ai";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";

interface UserMessagePartProps {
  part: TextUIPart;
}
const MAX_TEXT_LENGTH = 600;
export function UserMessagePart({ part }: UserMessagePartProps) {
  const [copied, copy] = useCopy();

  const [expanded, setExpanded] = useState(false);

  const isLongText = useMemo(
    () => part.text.length > MAX_TEXT_LENGTH,
    [part.text],
  );
  const displayText = useMemo(
    () =>
      expanded || !isLongText
        ? part.text
        : truncateString(part.text, MAX_TEXT_LENGTH),
    [expanded, isLongText, part.text],
  );
  return (
    <div className="flex flex-col gap-2 items-end my-2">
      <div
        data-testid="message-content"
        className="flex flex-col gap-4 max-w-full relative overflow-hidden bg-primary text-primary-foreground px-4 py-3 rounded-2xl"
      >
        {isLongText && !expanded && (
          <div className="absolute pointer-events-none bg-linear-to-t from-accent to-transparent w-full h-40 bottom-0 left-0" />
        )}
        <p className={cn("whitespace-pre-wrap text-sm wrap-break-word")}>
          {displayText}
        </p>
        {isLongText && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-auto p-1 text-xs z-10 text-muted-foreground hover:text-foreground self-start"
          >
            <span className="flex items-center gap-1">
              {expanded ? "접기" : "더보기"}
              {expanded ? (
                <ChevronUpIcon className="size-3" />
              ) : (
                <ChevronDownIcon className="size-3" />
              )}
            </span>
          </Button>
        )}
      </div>
      <div className="flex w-full justify-end opacity-0 group-hover/message:opacity-100 transition-opacity duration-300">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-edit-button"
              variant="ghost"
              size="icon"
              className={cn("size-3! p-4!")}
              onClick={() => copy(part.text)}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">복사하기</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

interface AssistantMessagePartProps {
  part: TextUIPart;
  streaming?: boolean;
}
export function AssistantTextPart({
  part,
  streaming,
}: AssistantMessagePartProps) {
  const [copied, copy] = useCopy();
  return (
    <div className="flex flex-col gap-2 group/message">
      <div data-testid="message-content" className="flex flex-col gap-4 px-2">
        <Streamdown>{part.text}</Streamdown>
      </div>
      <div className="flex w-full opacity-0 group-hover/message:opacity-100 transition-opacity duration-300">
        {!streaming && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid="message-edit-button"
                variant="ghost"
                size="icon"
                className={cn("size-3! p-4!")}
                onClick={() => copy(part.text)}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">복사하기</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
