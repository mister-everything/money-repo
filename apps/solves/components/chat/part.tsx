import { UseChatHelpers } from "@ai-sdk/react";
import { AssistantMessageMetadata } from "@service/solves/shared";
import { isString } from "@workspace/util";
import {
  getToolName,
  ReasoningUIPart,
  TextUIPart,
  ToolUIPart,
  UIMessage,
} from "ai";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  EllipsisIcon,
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
import { READ_BLOCK_TOOL_NAME } from "@/lib/ai/tools/workbook/read-block-tool";
import { GEN_BLOCK_TOOL_NAMES } from "@/lib/ai/tools/workbook/shared";
import { cn } from "@/lib/utils";
import { MentionItem } from "../mention/mention-item";
import { normalizeMentions } from "../mention/shared";
import JsonView from "../ui/json-view";
import { AssistantMetadataToolTip } from "./assistant-metadata-tool-tip";
import { GenerateBlockToolPart } from "./tool-part/generate-block-tool-part";
import { ReadBlockToolPart } from "./tool-part/read-block-tool-part";
import { WebSearchToolPart } from "./tool-part/web-search-part";

interface UserMessagePartProps {
  part: TextUIPart;
  streaming?: boolean;
}

const MAX_TEXT_LENGTH = 600;

export function UserMessagePart({ part }: UserMessagePartProps) {
  const [copied, copy] = useCopy();

  const [expanded, setExpanded] = useState(false);

  const normalizedText = useMemo(() => {
    return normalizeMentions(part.text);
  }, [part.text]);

  const isLongText = useMemo(
    () => part.text.length > MAX_TEXT_LENGTH,
    [part.text],
  );

  return (
    <div className="flex flex-col gap-2 items-end my-2 text-sm">
      <div
        data-testid="message-content"
        className="flex flex-col gap-4 max-w-full relative overflow-hidden bg-primary text-primary-foreground px-4 py-3 rounded-2xl"
      >
        {isLongText && !expanded && (
          <div className="absolute pointer-events-none bg-linear-to-t from-accent to-transparent w-full h-40 bottom-0 left-0" />
        )}
        <div
          className={cn(
            "whitespace-pre-wrap text-sm wrap-break-word flex flex-wrap",
            isLongText && !expanded ? "max-h-40 overflow-hidden" : "",
          )}
        >
          {normalizedText.map((segment, idx) => {
            if (isString(segment)) {
              return (
                <span key={`t-${idx}`} className="inline">
                  {segment}
                </span>
              );
            }
            return (
              <MentionItem item={segment} key={`m-${segment.id}-${idx}`} />
            );
          })}
        </div>
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
  metadata?: AssistantMessageMetadata;
}
export function AssistantTextPart({
  part,
  streaming,
  metadata,
}: AssistantMessagePartProps) {
  const [copied, copy] = useCopy();
  return (
    <div className="flex flex-col gap-2 group/message text-sm">
      <div data-testid="message-content" className="flex flex-col gap-4 px-2">
        <Streamdown>{part.text}</Streamdown>
      </div>
      <div className="flex w-full opacity-0 group-hover/message:opacity-100 transition-opacity duration-300">
        {!streaming && (
          <>
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
              <TooltipContent>복사하기</TooltipContent>
            </Tooltip>
            {metadata && (
              <AssistantMetadataToolTip metadata={metadata}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("size-3! p-4!")}
                >
                  <EllipsisIcon />
                </Button>
              </AssistantMetadataToolTip>
            )}
          </>
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

  const startedAt = useMemo(() => {
    if (!streaming) return null;
    return Date.now();
  }, []);
  const endedAt = useMemo(() => {
    if (streaming) return Date.now();
    return Date.now();
  }, [streaming]);

  const durationSeconds = useMemo(() => {
    if (!startedAt || !endedAt) return null;
    return Math.floor((endedAt - startedAt) / 1000);
  }, [startedAt, endedAt]);

  return (
    <div
      className="flex flex-col cursor-pointer text-sm group select-none"
      onClick={() => {
        setIsExpanded(!isExpanded);
      }}
    >
      <div className="flex flex-row gap-2 items-center text-muted-foreground hover:text-accent-foreground transition-colors">
        {streaming ? (
          <TextShimmer>생각중...</TextShimmer>
        ) : (
          <div className="fade-300">
            {durationSeconds
              ? `${durationSeconds}초 동안 생각함`
              : "잠시 생각함"}
          </div>
        )}

        <button
          data-testid="message-reasoning-toggle"
          type="button"
          className="cursor-pointer"
        >
          <ChevronDownIcon
            className={cn("size-3.5", isExpanded ? "rotate-180" : "")}
          />
        </button>
      </div>

      <div className="pl-4">
        <AnimatePresence initial={false}>
          {(isExpanded || streaming) && (
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
              <Streamdown className="fade-300">
                {(streaming
                  ? part.text?.split("\n").slice(-3).join("\n")
                  : part.text) || "...🤔"}
              </Streamdown>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ToolPart({
  part,
  addToolOutput,
}: {
  part: ToolUIPart;
  addToolOutput?: UseChatHelpers<UIMessage>["addToolOutput"];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toolName = useMemo(() => getToolName(part), [part.type]);

  const isPending = useMemo(() => {
    return !part.state.startsWith(`output-`);
  }, [part.state]);

  const isGenerateBlockTool = (name: string): name is GEN_BLOCK_TOOL_NAMES =>
    Object.values(GEN_BLOCK_TOOL_NAMES).includes(name as GEN_BLOCK_TOOL_NAMES);

  if (isGenerateBlockTool(toolName)) {
    return (
      <div className="p-4">
        <GenerateBlockToolPart part={part} type={toolName} />
      </div>
    );
  }

  if (toolName === EXA_SEARCH_TOOL_NAME) {
    return (
      <div className="p-2">
        <WebSearchToolPart part={part} />
      </div>
    );
  }
  if (toolName === READ_BLOCK_TOOL_NAME) {
    return <ReadBlockToolPart part={part} addToolOutput={addToolOutput} />;
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
