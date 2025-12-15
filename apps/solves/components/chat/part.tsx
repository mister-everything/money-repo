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
import { EXA_SEARCH_TOOL_NAME } from "@/lib/ai/tools/web-search/types";
import {
  GENERATE_WORKBOOK_TOOL_NAMES,
  GenerateToolNameType,
} from "@/lib/ai/tools/workbook/types";
import { cn } from "@/lib/utils";
import JsonView from "../ui/json-view";
import { GenerateToolPart } from "./tool-part/generate-block-tool-part";
import { WebSearchToolPart } from "./tool-part/web-search-part";

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
    <div className="flex flex-col gap-2 group/message text-sm">
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
  defaultExpanded?: boolean;
}

export function ReasoningPart({
  part,
  streaming,
  defaultExpanded = false,
}: ReasoningPartProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className="flex flex-col cursor-pointer text-sm"
      onClick={() => {
        setIsExpanded(!isExpanded);
      }}
    >
      <div className="flex flex-row gap-2 items-center text-muted-foreground hover:text-accent-foreground transition-colors">
        {streaming ? (
          <TextShimmer>생각중...</TextShimmer>
        ) : (
          <div className="font-medium">생각하는 과정</div>
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
              <Streamdown>{part.text || (streaming ? "" : "...🤔")}</Streamdown>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ToolPart({ part }: { part: ToolUIPart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toolName = useMemo(() => getToolName(part), [part.type]);

  const isPending = useMemo(() => {
    return !part.state.startsWith(`output-`);
  }, [part.state]);

  const isWorkbookTool = (name: string): name is GenerateToolNameType =>
    GENERATE_WORKBOOK_TOOL_NAMES.includes(name as GenerateToolNameType);

  if (isWorkbookTool(toolName)) {
    return (
      <div className="p-4">
        <GenerateToolPart part={part} type={toolName} />
      </div>
    );
  }

  if (toolName === EXA_SEARCH_TOOL_NAME) {
    return (
      <div className="p-2 ">
        <WebSearchToolPart part={part} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col cursor-pointer text-sm"
      onClick={() => {
        setIsExpanded(!isExpanded);
      }}
    >
      <div className="flex flex-row gap-2 items-center text-muted-foreground hover:text-accent-foreground transition-colors">
        {isPending ? (
          <TextShimmer>도구 실행중...</TextShimmer>
        ) : (
          <div className="font-medium">도구 실행 결과</div>
        )}

        <button
          data-testid="message-reasoning-toggle"
          type="button"
          className="cursor-pointer"
        >
          <ChevronDownIcon size={16} />
        </button>
      </div>

      <div className="pl-4" onClick={(e) => e.stopPropagation()}>
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
              <JsonView
                data={{
                  input: part.input,
                  output: part.output,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
