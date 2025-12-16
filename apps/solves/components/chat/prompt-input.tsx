"use client";
import { ChatModel } from "@service/solves/shared";
import { Editor } from "@tiptap/react";
import { ChevronDown, SearchIcon, SendIcon, SquareIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { RefObject, useCallback, useMemo } from "react";
import { MentionSuggestionComponentProps } from "@/components/ui/mention-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ModelProviderIcon } from "../ui/model-provider-icon";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ModelDropDownMenu } from "./model-drop-down-menu";

const MentionInput = dynamic(() => import("@/components/ui/mention-input"), {
  ssr: false,
  loading() {
    return <div className="h-8 w-full animate-pulse"></div>;
  },
});

interface PromptInputProps<T = any> {
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
  metionItems?: {
    group?: string;
    value: T[];
    label: string;
  };
  MentionItemComponent;
}

export default function PromptInput({
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
}: PromptInputProps) {
  const handleChange = useCallback(
    ({ text, mentions }: { text: string; mentions: any[] }) => {
      onChange(text);
      console.log({ mentions });
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
          MentionItemComponent={MentionItemComponent}
          SuggestionComponent={Suggestion}
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

function Suggestion({
  onSelectMention,
  onClose,
  top,
  left,
  style,
  children,
}: MentionSuggestionComponentProps) {
  const isMobile = useIsMobile();
  const trigger = useMemo(() => {
    if (children) return children;
    return (
      <span
        className="fixed z-50"
        style={{
          top,
          left,
        }}
      ></span>
    );
  }, [children, top, left]);
  return (
    <Popover
      open={true}
      onOpenChange={(f) => {
        !f && onClose();
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        side="top"
        style={{
          ...style,
          width: style?.width || (isMobile ? "100%" : "auto"),
          minWidth: isMobile ? undefined : "600px",
          maxWidth: isMobile ? undefined : "800px",
        }}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <input
              className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={"검색하세요."}
              // value={searchValue}
              // onChange={(e) => setSearchValue(e.target.value)}
              // onKeyDown={(e) => {
              //   if (e.key === "Backspace" && !e.currentTarget.value) {
              //     onClose();
              //   }
              //   if (e.key === "Enter" && allMentions.length > 0) {
              //     e.preventDefault();
              //     allMentions[selectedIndex].onSelect();
              //   }
              //   if (e.key === "ArrowDown") {
              //     e.preventDefault();
              //     setSelectedIndex((prev) =>
              //       prev < allMentions.length - 1 ? prev + 1 : 0,
              //     );
              //   }
              //   if (e.key === "ArrowUp") {
              //     e.preventDefault();
              //     setSelectedIndex((prev) =>
              //       prev > 0 ? prev - 1 : allMentions.length - 1,
              //     );
              //   }
              //   if (
              //     !isMobile &&
              //     (e.key === "ArrowLeft" || e.key === "ArrowRight")
              //   ) {
              //     e.preventDefault();
              //     // Calculate column navigation
              //     const currentItem = allMentions[selectedIndex];
              //     const currentType =
              //       currentItem.type === "mcpTool" ? "mcp" : currentItem.type;
              //     const typeOrder = ["agent", "workflow", "mcp", "defaultTool"];
              //     const currentTypeIndex = typeOrder.indexOf(currentType);

              //     if (e.key === "ArrowLeft" && currentTypeIndex > 0) {
              //       const prevType = typeOrder[currentTypeIndex - 1];
              //       const prevTypeItems = allMentions.filter(
              //         (item) =>
              //           item.type === prevType ||
              //           (prevType === "mcp" && item.type === "mcpTool"),
              //       );
              //       if (prevTypeItems.length > 0) {
              //         setSelectedIndex(allMentions.indexOf(prevTypeItems[0]));
              //       }
              //     } else if (
              //       e.key === "ArrowRight" &&
              //       currentTypeIndex < typeOrder.length - 1
              //     ) {
              //       const nextType = typeOrder[currentTypeIndex + 1];
              //       const nextTypeItems = allMentions.filter(
              //         (item) =>
              //           item.type === nextType ||
              //           (nextType === "mcp" && item.type === "mcpTool"),
              //       );
              //       if (nextTypeItems.length > 0) {
              //         setSelectedIndex(allMentions.indexOf(nextTypeItems[0]));
              //       }
              //     }
              //   }
              // }}
              autoFocus
            />
          </div>

          <div
            className={cn(
              "overflow-hidden",
              isMobile ? "max-h-[50vh]" : "h-[300px]",
            )}
          >
            <Button
              onClick={() =>
                onSelectMention({
                  label: "test",
                  id: "test",
                  ["data-mention"]: JSON.stringify({
                    testData: {
                      name: "cgoing",
                      age: 31,
                      childrens: [{ name: "jj" }],
                    },
                  }),
                  class: JSON.stringify({
                    testData: {
                      name: "cgoing",
                      age: 31,
                      childrens: [{ name: "jj" }],
                    },
                  }),
                })
              }
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
