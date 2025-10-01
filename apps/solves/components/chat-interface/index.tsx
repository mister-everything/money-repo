"use client";

import {
  ArrowUp,
  Check,
  ChevronDown,
  FilePlus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  ChatInterfaceProps,
  ChatOption,
  Message,
  ModelOption,
} from "./types";

const minTextareaHeight = 56;
const maxTextareaHeight = 120;

const defaultModelOptions: ModelOption[] = [
  { id: "gpt-4o", label: "GPT-4o", description: "고정밀 분석" },
  { id: "claude-3", label: "Claude 3", description: "긴 문서 분석" },
  { id: "sonnet", label: "Sonnet", description: "빠른 응답" },
];

const chatOptions: ChatOption[] = ["설명", "문제풀이", "유사문제"];

interface InternalMessageProps {
  message: Message;
}

const ChatMessageBubble = memo(({ message }: InternalMessageProps) => {
  const isUser = message.sender === "user";

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
      role="listitem"
      aria-label={isUser ? "사용자 메시지" : "AI 메시지"}
    >
      <div
        className={cn(
          "relative max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground border border-border rounded-bl-md",
        )}
      >
        {message.content}
      </div>
      <time
        className="text-[10px] text-muted-foreground"
        dateTime={message.timestamp.toISOString()}
      >
        {message.timestamp.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
    </div>
  );
});
ChatMessageBubble.displayName = "ChatMessageBubble";

interface OptionButtonProps {
  option: ChatOption;
  isSelected: boolean;
  onSelect: (option: ChatOption) => void;
}

const OptionButton = memo(
  ({ option, isSelected, onSelect }: OptionButtonProps) => {
    return (
      <Button
        type="button"
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={() => onSelect(option)}
        className={cn(
          "rounded-full border-border/80 px-4 py-2 text-xs font-medium transition-colors",
          isSelected
            ? "shadow-sm"
            : "bg-background/70 hover:bg-accent hover:text-accent-foreground",
        )}
        aria-pressed={isSelected}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {option}
      </Button>
    );
  },
);
OptionButton.displayName = "OptionButton";

function ChatHeader({
  selectedOption,
  onOptionChange,
  documentUploaded,
}: {
  selectedOption: ChatOption;
  onOptionChange: (option: ChatOption) => void;
  documentUploaded?: boolean;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-border/60 bg-background/50 px-4 py-3">
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
        {documentUploaded ? (
          <p>
            문서 분석 준비가 완료되었습니다. 원하는 분석 옵션을 선택하고 질문을
            입력해 주세요.
          </p>
        ) : (
          <p>
            문서를 업로드하면 더욱 정확한 답변을 제공할 수 있습니다. 업로드
            전에도 기본적인 질문에는 답변할 수 있어요.
          </p>
        )}
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="문서 분석 옵션"
      >
        {chatOptions.map((option) => (
          <OptionButton
            key={option}
            option={option}
            isSelected={selectedOption === option}
            onSelect={onOptionChange}
          />
        ))}
      </div>
    </header>
  );
}

const MessagesList = memo(function MessagesList({
  messages,
  isLoading,
}: {
  messages: Message[];
  isLoading?: boolean;
}) {
  return (
    <div
      className="flex-1 space-y-4 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/50"
      role="list"
      aria-live="polite"
      aria-busy={isLoading}
    >
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          응답을 생성 중입니다...
        </div>
      )}
      {!messages.length && !isLoading && (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground/80">
          아직 대화가 없습니다. 문서와 관련된 질문을 입력해 보세요.
        </div>
      )}
    </div>
  );
});

const Composer = memo(function Composer({
  onSend,
  selectedOption,
  modelOptions,
  currentModel,
  setCurrentModel,
  isLoading,
}: {
  onSend: (message: string) => void;
  selectedOption: ChatOption;
  modelOptions: ModelOption[];
  currentModel: string;
  setCurrentModel: (model: string) => void;
  isLoading?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>({} as HTMLTextAreaElement);
  const [inputValue, setInputValue] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = `${minTextareaHeight}px`;
    }
  }, [inputValue, onSend, isLoading]);

  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    };

    textarea.addEventListener("keydown", handleKeyDown);

    return () => textarea.removeEventListener("keydown", handleKeyDown);
  }, [handleSend]);

  const modelLabel = useMemo(() => {
    const current = modelOptions.find((option) => option.id === currentModel);
    return current ? current.label : "모델 선택";
  }, [modelOptions, currentModel]);

  return (
    <footer className="border-t border-border/60 bg-background/70 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>Enter로 전송 · Shift+Enter로 줄바꿈</span>
        <span className="font-medium text-foreground/75">
          선택된 옵션: {selectedOption}
        </span>
      </div>
      <div className="relative flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-xs"
            aria-label="파일 첨부"
          >
            <FilePlus className="h-3.5 w-3.5" />
            첨부파일
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                aria-label="모델 선택"
              >
                {modelLabel}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuLabel>모델 선택</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={currentModel}
                onValueChange={setCurrentModel}
              >
                {modelOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.id} value={option.id}>
                    <div className="flex flex-col text-sm">
                      <span className="flex items-center gap-1 text-foreground">
                        {currentModel === option.id && (
                          <Check className="h-3 w-3" />
                        )}
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Label htmlFor="chat-message" className="sr-only">
          메시지 입력
        </Label>
        <Textarea
          id="chat-message"
          ref={textareaRef}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="질문이나 요청을 입력하세요"
          className="w-full resize-none border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          style={{
            minHeight: minTextareaHeight,
            maxHeight: maxTextareaHeight,
          }}
          aria-label="메시지 입력"
        />

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Shift+Enter로 줄바꿈</span>
          <Button
            type="button"
            size="sm"
            className="gap-2 text-xs"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
            전송
          </Button>
        </div>
      </div>
    </footer>
  );
});
Composer.displayName = "Composer";

export function ChatInterface({
  onSendMessage,
  messages,
  isLoading,
  documentUploaded,
  className,
}: ChatInterfaceProps) {
  const [selectedOption, setSelectedOption] = useState<ChatOption>("설명");
  const [currentModel, setCurrentModel] = useState<string>(
    defaultModelOptions[0].id,
  );

  const handleSend = useCallback(
    (message: string) => {
      onSendMessage(message, selectedOption);
    },
    [onSendMessage, selectedOption],
  );

  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-3xl border border-border/60 bg-background/70 shadow-sm backdrop-blur-sm",
        "@container/chat-panel",
        className,
      )}
      aria-label="AI 문서 채팅 인터페이스"
    >
      <ChatHeader
        selectedOption={selectedOption}
        onOptionChange={setSelectedOption}
        documentUploaded={documentUploaded}
      />
      <MessagesList messages={messages} isLoading={isLoading} />
      <Composer
        onSend={handleSend}
        selectedOption={selectedOption}
        modelOptions={defaultModelOptions}
        currentModel={currentModel}
        setCurrentModel={setCurrentModel}
        isLoading={isLoading}
      />
    </section>
  );
}

export { ChatDrawer } from "./chat-drawer";
export type { ChatInterfaceProps };
