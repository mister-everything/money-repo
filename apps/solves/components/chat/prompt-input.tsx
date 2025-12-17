"use client";
import { ChatModel } from "@service/solves/shared";
import { Editor } from "@tiptap/react";
import { ChevronDown, SendIcon, SquareIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { RefObject, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SolvesMentionItem } from "../mention/types";
import { Button } from "../ui/button";
import { ModelProviderIcon } from "../ui/model-provider-icon";
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
  onChange: (text: string) => void;
  onMentionChange?: (mentions: SolvesMentionItem[]) => void;
  onEnter?: () => void;
  placeholder?: string;
  input: string;
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
  className?: string;
}

export default function PromptInput({
  onChange,
  onEnter,
  placeholder,
  input,
  onFocus,
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
      onChange(text);
      onMentionChange?.(mentions);
    },
    [],
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
          placeholder={chatModel ? placeholder : "AI를 먼저 선택해주세요"}
          suggestionChar="@"
          onChange={handleChange}
          editorRef={editorRef}
          onFocus={onFocus}
          onBlur={onBlur}
          items={mentionItems}
          onAppendMention={onAppendMention}
        />
      </div>
      <div className="w-full flex justify-end gap-1 items-center">
        <ModelDropDownMenu
          defaultModel={chatModel}
          onModelChange={onChatModelChange}
          align="end"
          side="top"
        >
          <Button
            variant={"ghost"}
            size={"sm"}
            className="group data-[state=open]:bg-input! hover:bg-input! mr-1"
            data-testid="model-selector-button"
          >
            {chatModel?.model ? (
              <>
                <ModelProviderIcon
                  provider={chatModel.provider}
                  className="size-3 opacity-0 group-hover:opacity-100 group-data-[state=open]:opacity-100 transition-opacity duration-200"
                />
                <span
                  className="text-foreground group-data-[state=open]:text-foreground  "
                  data-testid="selected-model-name"
                >
                  {chatModel?.displayName}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">모델 선택</span>
            )}

            <ChevronDown className="size-3 group-data-[state=open]:rotate-180 transition-transform duration-200" />
          </Button>
        </ModelDropDownMenu>
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
