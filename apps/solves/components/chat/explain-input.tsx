"use client";
import { ChatModel } from "@service/solves/shared";
import { Editor } from "@tiptap/react";
import { ChevronDown, SendIcon, SparklesIcon, SquareIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { RefObject, useCallback } from "react";
import { Button } from "../ui/button";
import { ModelProviderIcon } from "../ui/model-provider-icon";
import { ModelDropDownMenu } from "./model-drop-down-menu";

const MentionInput = dynamic(() => import("@/components/ui/mention-input"), {
  ssr: false,
  loading() {
    return <div className="h-8 w-full animate-pulse"></div>;
  },
});

interface ExplainInputProps {
  onChange: (text: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  input: string;
  ref?: RefObject<Editor | null>;
  onFocus?: () => void;
  onBlur?: () => void;

  onSendButtonClick?: () => void;
  disabledSendButton?: boolean;
  isSending?: boolean;
  chatModel?: ChatModel;
  onChatModelChange?: (model: ChatModel) => void;
}

export default function ExplainInput({
  onChange,
  onEnter,
  placeholder,
  ref,
  input,
  onFocus,
  onBlur,
  onSendButtonClick,
  disabledSendButton,
  isSending,
  chatModel,
  onChatModelChange,
}: ExplainInputProps) {
  const handleChange = useCallback(
    ({ text }: { text: string; mentions: { label: string; id: string }[] }) => {
      onChange(text);
    },
    [onChange],
  );

  return (
    <div className="bg-background border text-sm rounded-2xl p-2 flex flex-col gap-2">
      <div className="w-full">
        <MentionInput
          content={input}
          onEnter={chatModel ? onEnter : undefined}
          placeholder={chatModel ? placeholder : "AI를 먼저 선택해주세요"}
          suggestionChar="@"
          onChange={handleChange}
          editorRef={ref}
          onFocus={onFocus}
          onBlur={onBlur}
          fullWidthSuggestion={true}
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
          variant="outline"
          size="sm"
          className="gap-2 px-3 py-2 w-fit border-orange-500 bg-orange-50 hover:bg-orange-100 hover:text-orange-600 text-orange-500 dark:border-orange-400 dark:bg-orange-950/20 dark:text-orange-400 dark:hover:bg-orange-950/60"
          onClick={onSendButtonClick}
          disabled={disabledSendButton || !chatModel}
        >
          {isSending ? (
            <SparklesIcon className="size-4 animate-spin" />
          ) : (
            <SparklesIcon className="size-4" />
          )}
          AI로 생성하기
        </Button>
      </div>
    </div>
  );
}
