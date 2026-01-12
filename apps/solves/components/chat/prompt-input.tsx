"use client";
import { ChatModel } from "@service/solves/shared";
import { Editor } from "@tiptap/react";
import { SendIcon, SquareIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { RefObject, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SolvesMentionItem } from "../mention/types";
import { Button } from "../ui/button";
import { ModelDropDownMenu } from "./model-drop-down-menu";

const MentionInput = dynamic(
  () => import("@/components/mention/mention-input"),
  {
    ssr: false,
    loading() {
      return <div className="h-8 w-full animate-pulse"></div>;
    },
  },
);

interface PromptInputProps {
  onChange?: (text: string) => void;
  onMentionChange?: (mentions: SolvesMentionItem[]) => void;
  onEnter?: () => void;
  placeholder?: string;
  input?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSendButtonClick?: () => void;
  disabledSendButton?: boolean;
  isSending?: boolean;
  onAppendMention?: (mention: SolvesMentionItem) => void;
  chatModel?: ChatModel;
  onChatModelChange?: (model: ChatModel) => void;
  mentionItems?: (searchValue: string) => SolvesMentionItem[];
  editorRef?: RefObject<Editor | null>;
  autofocus?: boolean;
  className?: string;
}

export default function PromptInput({
  onChange,
  onEnter,
  placeholder = "무엇이든 물어보세요",
  input = "",
  onFocus,
  autofocus,
  onBlur,
  onSendButtonClick,
  disabledSendButton,
  isSending,
  chatModel,
  onChatModelChange,
  mentionItems,
  onAppendMention,
  onMentionChange,
  editorRef,
  className,
}: PromptInputProps) {
  const handleChange = useCallback(
    ({ text, mentions }: { text: string; mentions: SolvesMentionItem[] }) => {
      onChange?.(text);
      onMentionChange?.(mentions);
    },
    [onChange, onMentionChange],
  );

  return (
    <div
      className={cn(
        "bg-background border text-sm rounded-2xl p-2 flex flex-col gap-2",
        className,
      )}
    >
      <div className="w-full">
        <MentionInput
          defaultContent={input}
          onEnter={chatModel ? onEnter : undefined}
          placeholder={
            placeholder || (chatModel ? "AI를 먼저 선택해주세요" : undefined)
          }
          suggestionChar="@"
          onChange={handleChange}
          editorRef={editorRef}
          onFocus={onFocus}
          onBlur={onBlur}
          items={mentionItems}
          onAppendMention={onAppendMention}
          autofocus={autofocus}
        />
      </div>
      <div className="w-full flex justify-end gap-1 items-center">
        <ModelDropDownMenu
          defaultModel={chatModel}
          onModelChange={onChatModelChange}
          align="end"
          side="top"
        />

        <Button
          size={"sm"}
          className="p-2!"
          onClick={onSendButtonClick}
          disabled={disabledSendButton || !chatModel}
        >
          {isSending ? (
            <SquareIcon className="fill-primary-foreground" />
          ) : (
            <SendIcon />
          )}
        </Button>
      </div>
    </div>
  );
}
