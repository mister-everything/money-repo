"use client";

import { equal, errorToString } from "@workspace/util";
import { ChatStatus, isToolUIPart, type UIMessage } from "ai";
import { AlertTriangleIcon, RefreshCcwIcon } from "lucide-react";
import { memo, useMemo } from "react";
import { Think } from "@/components/ui/think";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  AssistantTextPart,
  ReasoningPart,
  ToolPart,
  UserMessagePart,
} from "./part";

function isStreamingMessage(
  props: Pick<MessageProps, "status" | "isLastMessage">,
) {
  return props.status == "streaming" && props.isLastMessage;
}

export interface MessageProps {
  message: UIMessage;
  isLastMessage?: boolean;
  status?: ChatStatus;
  className?: string;
}

const PurePreviewMessage = ({
  message,
  status,
  isLastMessage,
  className,
}: MessageProps) => {
  if (message.role == "system") {
    return null; // system message 는 표기하지 않음
  }

  const showThink = useMemo(() => {
    if (!isLastMessage) return false;
    if (status == "ready" || status == "error") return false;
    if (message.role == "user") return true;
    return (
      message.parts.filter((part) => part.type == "step-start").length == 0
    );
  }, [isLastMessage, status, message.parts.length]);

  return (
    <div
      className={cn(
        "w-full mx-auto max-w-3xl px-2 group/message fade-300",
        className,
      )}
    >
      <div className="flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl">
        <div className="flex flex-col gap-4 w-full">
          {message.parts.map((part, index) => {
            const key = `message-${message.id}-${index}`;
            const isLastPart = index === message.parts.length - 1;
            const isStreaming =
              isStreamingMessage({
                status,
                isLastMessage,
              }) && isLastPart;

            if (part.type === "text") {
              if (message.role == "user")
                return (
                  <UserMessagePart
                    part={part}
                    key={key}
                    streaming={isStreaming}
                  />
                );
              else
                return (
                  <AssistantTextPart
                    part={part}
                    streaming={isStreaming}
                    key={key}
                  />
                );
            }

            if (part.type === "reasoning") {
              return (
                <ReasoningPart
                  part={part}
                  key={key}
                  streaming={isStreaming}
                  defaultExpanded={isLastMessage}
                />
              );
            }

            if (isToolUIPart(part)) {
              return <ToolPart key={key} part={part} />;
            }
            if (part.type === "step-start") {
              return null;
            }
            return <div key={key}> unknown part {part.type}</div>;
          })}
        </div>
      </div>
      {showThink && (
        <div className="px-2">
          <Think />
        </div>
      )}
    </div>
  );
};

export const Message = memo(
  PurePreviewMessage,
  function equalMessage(prevProps: MessageProps, nextProps: MessageProps) {
    if (isStreamingMessage(prevProps) || isStreamingMessage(nextProps))
      return false;

    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.isLastMessage !== nextProps.isLastMessage) return false;

    if (!equal(prevProps.message.metadata, nextProps.message.metadata))
      return false;
    if (prevProps.className !== nextProps.className) return false;

    if (prevProps.message.parts.length !== nextProps.message.parts.length) {
      return false;
    }
    if (!equal(prevProps.message.parts, nextProps.message.parts)) {
      return false;
    }
    if (prevProps.status !== nextProps.status) return false;
    return true;
  },
);

export function ChatErrorMessage({
  error,
  clearError,
}: {
  error: Error;
  clearError: () => void;
}) {
  return (
    <div className="flex items-center justify-center  flex-col gap-4 bg-point/5 text-point rounded-lg p-6 text-sm ">
      <AlertTriangleIcon className="size-8" />
      <p>{errorToString(error)}</p>

      <Button
        className="w-full shadow-none bg-point/10 text-point border-point hover:bg-point hover:text-background"
        variant="outline"
        size="lg"
        onClick={clearError}
      >
        <RefreshCcwIcon />
        채팅 새로 고침
      </Button>
    </div>
  );
}
