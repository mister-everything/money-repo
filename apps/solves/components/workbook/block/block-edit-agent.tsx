import { useChat } from "@ai-sdk/react";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { BlockAnswer, BlockContent, BlockType } from "@service/solves/shared";
import { DefaultChatTransport, isToolUIPart, UIDataTypes } from "ai";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import z from "zod";
import { EditFields, WorkbookEditChatRequest } from "@/app/api/ai/shared";
import { Button } from "@/components/ui/button";
import PromptInputDynamicGrow from "@/components/ui/prompt-input-dynamic-grow";
import {
  EDIT_FIELD_TOOL_NAMES,
  EditQuestionInput,
  EditSolutionInput,
} from "@/lib/ai/tools/workbook/shared";
import { handleErrorToast } from "@/lib/handle-toast";
import { useAiStore } from "@/store/ai-store";
import { BlockSuggest } from "./block-suggest";

type Props<T extends BlockType = BlockType> = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  type: T;
  question: string;
  content: BlockContent<T>;
  answer: BlockAnswer<T>;
  onUpdateQuestion?: (question: string) => void;
  onUpdateContent?: (content: BlockContent<T>) => void;
  onUpdateAnswer?: (answer: BlockAnswer<T>) => void;
  onUpdateSolution?: (solution: string) => void;
};

export type BlockEditState<T extends BlockType = BlockType> = {
  question?: string;
  content?: BlockContent<T>;
  answer?: BlockAnswer<T>;
  solution?: string | undefined;
};

const MENU_OPTIONS: { label: string; value: EditFields }[] = [
  { label: "문제", value: EditFields.QUESTION },
  { label: "보기", value: EditFields.CONTENT },
  { label: "정답", value: EditFields.ANSWER },
  { label: "해설", value: EditFields.SOLUTION },
];

export function BlockEditAgent<T extends BlockType = BlockType>({
  open,
  onOpenChange,
  children,
  type,
  question,
  content,
  answer,
  onUpdateQuestion,
  onUpdateContent,
  onUpdateAnswer,
  onUpdateSolution,
}: Props<T>) {
  const [blockEditState, setBlockEditState] =
    useState<BlockEditState<T> | null>(null);
  const [selectedMenuOptions, setSelectedMenuOptions] = useState<string[]>([]);
  const selectedMenuOptionsRef = useRef<string[]>([]);
  useEffect(() => {
    selectedMenuOptionsRef.current = selectedMenuOptions;
  }, [selectedMenuOptions]);
  const { sendMessage, setMessages, status } = useChat({
    onError: handleErrorToast,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat/workbook/edit",
      prepareSendMessagesRequest: ({ messages }) => {
        const body: z.infer<typeof WorkbookEditChatRequest> =
          WorkbookEditChatRequest.parse({
            messages,
            model: useAiStore.getState().chatModel!,
            type,
            question,
            content,
            answer,
            editFields: selectedMenuOptionsRef.current,
          });
        return {
          body,
        };
      },
    }),
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === EDIT_FIELD_TOOL_NAMES.QUESTION) {
        const updatedQuestion = (toolCall.input as EditQuestionInput).question;
        setBlockEditState((prev) => ({
          ...(prev ?? {}),
          question: updatedQuestion,
        }));
        return;
      }
      if (toolCall.toolName === EDIT_FIELD_TOOL_NAMES.CONTENT) {
        const updatedContent = toolCall.input as BlockContent<T>;
        setBlockEditState((prev) => ({
          ...(prev ?? {}),
          content: updatedContent,
        }));
        return;
      }
      if (toolCall.toolName === EDIT_FIELD_TOOL_NAMES.ANSWER) {
        const updatedAnswer = toolCall.input as BlockAnswer<T>;
        setBlockEditState((prev) => ({
          ...(prev ?? {}),
          answer: updatedAnswer,
        }));
        return;
      }
      if (toolCall.toolName === EDIT_FIELD_TOOL_NAMES.SOLUTION) {
        const updatedSolution = (toolCall.input as EditSolutionInput).solution;
        setBlockEditState((prev) => ({
          ...(prev ?? {}),
          solution: updatedSolution,
        }));
      }
    },

    onFinish: ({ messages }) => {
      const lastMessage = messages.at(-1);
      if (lastMessage?.role !== "assistant") return;
      const toolParts = lastMessage?.parts.filter(isToolUIPart);
      if (!toolParts?.length) {
        clearBuffers();
      }
    },
  });

  const isBusy = status === "submitted" || status === "streaming";

  const clearBuffers = useCallback(() => {
    setBlockEditState(null);
  }, []);

  const dropEditField = useCallback((field: keyof BlockEditState<T>) => {
    setBlockEditState((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      delete next[field];
      // undefined 값만 남는 케이스까지 정리해서 껍데기 렌더를 방지
      const cleaned = Object.fromEntries(
        Object.entries(next).filter(([, v]) => v !== undefined),
      ) as BlockEditState<T>;
      return Object.keys(cleaned).length ? cleaned : null;
    });
  }, []);

  const handleAcceptQuestion = useCallback(() => {
    if (blockEditState?.question === undefined) return;
    onUpdateQuestion?.(blockEditState.question);
    dropEditField("question");
  }, [blockEditState?.question, dropEditField, onUpdateQuestion]);

  const handleRejectQuestion = useCallback(() => {
    dropEditField("question");
  }, [dropEditField]);

  const handleAcceptContent = useCallback(() => {
    if (blockEditState?.content === undefined) return;
    onUpdateContent?.(blockEditState.content);
    dropEditField("content");
  }, [blockEditState?.content, dropEditField, onUpdateContent]);

  const handleRejectContent = useCallback(() => {
    dropEditField("content");
  }, [dropEditField]);

  const handleAcceptAnswer = useCallback(() => {
    if (blockEditState?.answer === undefined) return;
    onUpdateAnswer?.(blockEditState.answer);
    dropEditField("answer");
  }, [blockEditState?.answer, dropEditField, onUpdateAnswer]);

  const handleRejectAnswer = useCallback(() => {
    dropEditField("answer");
  }, [dropEditField]);

  const handleAcceptSolution = useCallback(() => {
    if (blockEditState?.solution === undefined) return;
    onUpdateSolution?.(blockEditState.solution);
    dropEditField("solution");
  }, [blockEditState?.solution, dropEditField, onUpdateSolution]);

  const handleRejectSolution = useCallback(() => {
    dropEditField("solution");
  }, [dropEditField]);

  const handleSendMessage = useCallback(
    (value: string) => {
      if (isBusy) return;
      setBlockEditState(null);
      setMessages([]);
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: value }],
        metadata: {
          selectedMenuOptions,
        } as UIDataTypes,
      });
    },
    [isBusy, selectedMenuOptions, sendMessage],
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverPortal>
        <PopoverContent side="right" align="start" sideOffset={12}>
          <PromptInputDynamicGrow
            placeholder="AI로 문제를 수정하세요"
            onSubmit={(value) => {
              handleSendMessage(value);
            }}
            menuOptions={MENU_OPTIONS}
            onOptionsChange={setSelectedMenuOptions}
            showEffects={true}
            expandOnFocus={true}
          />
          {blockEditState && (
            <div className="mt-1 mr-2">
              <div className="w-100">
                <BlockSuggest
                  question={question}
                  content={content}
                  answer={answer}
                  id={"block-suggest-id"}
                  index={0}
                  mode="preview"
                  order={0}
                  type={type}
                  blockEditState={blockEditState}
                  onAcceptQuestion={
                    blockEditState.question !== undefined
                      ? handleAcceptQuestion
                      : undefined
                  }
                  onRejectQuestion={
                    blockEditState.question !== undefined
                      ? handleRejectQuestion
                      : undefined
                  }
                  onAcceptContent={
                    blockEditState.content !== undefined
                      ? handleAcceptContent
                      : undefined
                  }
                  onRejectContent={
                    blockEditState.content !== undefined
                      ? handleRejectContent
                      : undefined
                  }
                  onAcceptAnswer={
                    blockEditState.answer !== undefined
                      ? handleAcceptAnswer
                      : undefined
                  }
                  onRejectAnswer={
                    blockEditState.answer !== undefined
                      ? handleRejectAnswer
                      : undefined
                  }
                  onAcceptSolution={
                    blockEditState.solution !== undefined
                      ? handleAcceptSolution
                      : undefined
                  }
                  onRejectSolution={
                    blockEditState.solution !== undefined
                      ? handleRejectSolution
                      : undefined
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground"
                  onClick={clearBuffers}
                  disabled={isBusy}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
