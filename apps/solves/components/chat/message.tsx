"use client";

import { equal } from "@workspace/util";
import { ChatStatus, isToolUIPart, type UIMessage } from "ai";

import { memo } from "react";
import { AssistantTextPart, ReasoningPart, UserMessagePart } from "./part";

function isStreamingMessage(
  props: Pick<MessageProps, "status" | "isLastMessage">,
) {
  return props.status == "streaming" && props.isLastMessage;
}

export interface MessageProps {
  message: UIMessage;
  isLastMessage?: boolean;
  status?: ChatStatus;
}

const PurePreviewMessage = ({
  message,
  status,
  isLastMessage,
}: MessageProps) => {
  if (message.role == "system") {
    return null; // system message 는 표기하지 않음
  }
  return (
    <div className="w-full mx-auto max-w-3xl px-2 group/message">
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
                <ReasoningPart part={part} key={key} streaming={isStreaming} />
              );
            }

            if (isToolUIPart(part)) {
              return (
                <div className="flex flex-col" key={key}>
                  <span>Tool Part</span>
                  <span>{JSON.stringify(part)}</span>
                </div>
              );
            }
            if (part.type === "step-start") {
              return null;
            }
            return <div key={key}> unknown part {part.type}</div>;
          })}
        </div>
      </div>
    </div>
  );
};

export const Message = memo(
  PurePreviewMessage,
  function equalMessage(prevProps: MessageProps, nextProps: MessageProps) {
    if (isStreamingMessage(prevProps) || isStreamingMessage(nextProps))
      return false;

    if (prevProps.message.id !== nextProps.message.id) return false;

    if (!equal(prevProps.message.metadata, nextProps.message.metadata))
      return false;

    if (prevProps.message.parts.length !== nextProps.message.parts.length) {
      return false;
    }
    if (!equal(prevProps.message.parts, nextProps.message.parts)) {
      return false;
    }
    return true;
  },
);
