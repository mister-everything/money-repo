import { UseChatHelpers } from "@ai-sdk/react";
import { serializeDetailBlock } from "@service/solves/shared";
import { wait } from "@workspace/util";
import { getToolName, ToolUIPart, UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import z from "zod";
import { Badge } from "@/components/ui/badge";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useToRef } from "@/hooks/use-to-ref";
import { ReadBlockInputSchema } from "@/lib/ai/tools/workbook/read-block-tool";
import { cn } from "@/lib/utils";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";

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

export function ReadBlockToolPart({
  part,
  addToolOutput,
}: {
  part: ToolUIPart;
  addToolOutput?: UseChatHelpers<UIMessage>["addToolOutput"];
}) {
  const input = part.input as z.infer<typeof ReadBlockInputSchema>;

  const [expanded, setExpanded] = useState(false);

  const output = part.output as
    | ReturnType<typeof serializeDetailBlock>[]
    | undefined;

  const order = input?.order ?? [];

  const isInProgress = useMemo(() => {
    return part.state.startsWith("input");
  }, [part.state]);

  const execute = useCallback(() => {
    if (!addToolOutput) return;
    const { blocks } = useWorkbookEditStore.getState();

    const normalizeBlocks = blocks
      .filter((_, i) => order.includes(i + 1))
      .map(serializeDetailBlock);

    addToolOutput({
      toolCallId: part.toolCallId,
      tool: getToolName(part),
      output: normalizeBlocks,
    });
  }, [addToolOutput, input, part.toolCallId]);

  const executeRef = useToRef(execute);

  useEffect(() => {
    if (part.state == "input-available" && !part.errorText) {
      wait(2000).then(() => {
        executeRef.current();
      });
    }
  }, [part.state]);

  return (
    <div
      className="flex flex-col cursor-pointer text-sm group select-none"
      onClick={() => {
        setExpanded(!expanded);
      }}
    >
      <div className="flex flex-row gap-2 items-center text-muted-foreground hover:text-accent-foreground transition-colors">
        {part.errorText ? (
          "문제 조회를 실패하였습니다."
        ) : (
          <>
            {order.slice(0, 3).map((n) => (
              <Badge
                key={n}
                variant="secondary"
                className="rounded-full bg-input! fade-300"
              >
                문제 {n}
              </Badge>
            ))}
            {isInProgress ? (
              <TextShimmer>
                {`${order.length > 3 ? `외 ${order.length - 3}개 문제` : ""}에 대해 자세히 확인중...`}
              </TextShimmer>
            ) : (
              <p>
                {order.length > 3 ? `외 ${order.length - 3}개 문제` : ""}에 대해
                자세히 확인함
              </p>
            )}
          </>
        )}
        {output?.length ? (
          <button
            data-testid="message-reasoning-toggle"
            type="button"
            className="cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <ChevronDownIcon
              className={cn("size-3.5", expanded ? "rotate-180" : "")}
            />
          </button>
        ) : null}
      </div>
      <div className="pl-4">
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              data-testid="message-reasoning"
              key="content"
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={variants}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
              className="pl-6 text-2xs text-muted-foreground border-l flex flex-col gap-4"
            >
              {output?.map((v) => {
                return (
                  <div
                    key={v.id}
                    className="rounded-lg border bg-background p-4 shadow-sm space-y-3 fade-300"
                  >
                    <div className="flex items-center gap-1">
                      <Badge className="rounded-full">{`문제 ${v.order}`}</Badge>{" "}
                      <Badge className="rounded-full" variant={"secondary"}>
                        {v.type}
                      </Badge>
                    </div>
                    <Streamdown>{v.question}</Streamdown>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
