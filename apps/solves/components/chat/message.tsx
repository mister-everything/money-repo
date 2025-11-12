"use client";

import { equal } from "@workspace/util";
import { isToolUIPart, type UIMessage } from "ai";
import { cn } from "lib/utils";

import { memo } from "react";

export interface MessageProps {
  message: UIMessage;
  className?: string;
}

const PurePreviewMessage = ({ message, className }: MessageProps) => {
  if (message.role == "system") {
    return null; // system message 는 표기하지 않음
  }

  return (
    <div className="w-full mx-auto max-w-3xl px-6 group/message">
      <div
        className={cn(
          "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
          className,
        )}
      >
        <div className="flex flex-col gap-4 w-full">
          {message.parts.map((part, index) => {
            const key = `message-${message.id}-${index}`;
            if (part.type === "reasoning") {
              return (
                <div className="flex flex-col">
                  <span>Reasoning Part</span>
                  <span>{part.text}</span>
                </div>
              );
            }

            if (part.type === "text") {
              return (
                <div className="flex flex-col">
                  <span>Text Part</span>
                  <span>{part.text}</span>
                </div>
              );
            }

            if (isToolUIPart(part)) {
              return (
                <div className="flex flex-col">
                  <span>Tool Part</span>
                  <span>{JSON.stringify(part)}</span>
                </div>
              );
            } else if (part.type === "step-start") {
              return null;
            } else {
              return <div key={key}> unknown part {part.type}</div>;
            }
          })}
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  function equalMessage(prevProps: MessageProps, nextProps: MessageProps) {
    if (prevProps.message.id !== nextProps.message.id) return false;

    if (prevProps.className !== nextProps.className) return false;

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
