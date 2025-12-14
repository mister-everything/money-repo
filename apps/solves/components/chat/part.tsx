import { truncateString } from "@workspace/util";
import { getToolName, ReasoningUIPart, TextUIPart, ToolUIPart } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { TextShimmer } from "@/components/ui/text-shimmer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";

interface UserMessagePartProps {
  part: TextUIPart;
  streaming?: boolean;
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

const variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  expanded: {
    height: "auto",
    opacity: 1,
    marginTop: "1rem",
    marginBottom: "0.5rem",
  },
};

interface ReasoningPartProps {
  part: ReasoningUIPart;
  streaming?: boolean;
}

export function ReasoningPart({ part, streaming }: ReasoningPartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="flex flex-col cursor-pointer"
      onClick={() => {
        setIsExpanded(!isExpanded);
      }}
    >
      <div className="flex flex-row gap-2 items-center text-muted-foreground hover:text-accent-foreground transition-colors">
        {streaming ? (
          <TextShimmer>Reasoned for a few seconds</TextShimmer>
        ) : (
          <div className="font-medium">Reasoned for a few seconds</div>
        )}

        <button
          data-testid="message-reasoning-toggle"
          type="button"
          className="cursor-pointer"
        >
          <ChevronDownIcon size={16} />
        </button>
      </div>

      <div className="pl-4">
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              data-testid="message-reasoning"
              key="content"
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={variants}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
              className="pl-6 text-muted-foreground border-l flex flex-col gap-4"
            >
              <Streamdown>
                {part.text || (streaming ? "" : "생각중...🤔")}
              </Streamdown>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ToolPart({ part }: { part: ToolUIPart }) {
  const toolName = getToolName(part);

  const extractPayload = (): any => part?.output ?? null;

  if (toolName === "generateMcqTool") {
    const payload = extractPayload();
    if (
      payload?.type === "mcq" &&
      typeof payload.question === "string" &&
      payload.content?.type === "mcq" &&
      Array.isArray(payload.content.options) &&
      payload.answer?.type === "mcq"
    ) {
      const answerId = payload.answer.answer;
      return (
        <div className="rounded-lg border bg-background p-4 shadow-sm space-y-3">
          <div className="text-sm font-semibold text-foreground">객관식</div>
          <div className="text-base text-foreground">{payload.question}</div>
          <div className="space-y-2">
            {payload.content.options.map((opt: any) => (
              <label
                key={opt.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                  opt.id === answerId
                    ? "border-primary/60 bg-primary/5 text-primary"
                    : "border-muted bg-muted/40",
                )}
              >
                <input
                  type="radio"
                  readOnly
                  checked={opt.id === answerId}
                  className="h-4 w-4 accent-primary"
                />
                <span>{opt.text}</span>
                {opt.id === answerId && (
                  <span className="ml-auto text-xs text-primary">(정답)</span>
                )}
              </label>
            ))}
          </div>
          {payload.answer.solution && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              {payload.answer.solution}
            </div>
          )}
        </div>
      );
    }
  }

  if (toolName === "generateSubjectiveTool") {
    const payload = extractPayload();
    if (
      payload?.type === "default" &&
      typeof payload.question === "string" &&
      payload.content?.type === "default" &&
      Array.isArray(payload.answer?.answer)
    ) {
      return (
        <div className="rounded-lg border bg-background p-4 shadow-sm space-y-3">
          <div className="text-sm font-semibold text-foreground">주관식</div>
          <div className="text-base text-foreground">{payload.question}</div>
          <div className="flex flex-wrap gap-2">
            {payload.answer.answer.map((ans: string, idx: number) => (
              <span
                key={`${ans}-${idx}`}
                className="rounded-full border bg-muted px-3 py-1 text-xs text-foreground"
              >
                {ans}
              </span>
            ))}
          </div>
          {payload.answer.solution && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              {payload.answer.solution}
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col">
      <span>Tool Part</span>
      <span>{JSON.stringify(part)}</span>
    </div>
  );
}
