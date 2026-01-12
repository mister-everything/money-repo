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

type Props<T extends BlockType = BlockType> = {
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

type BlockSnapshot<T extends BlockType = BlockType> = {
  question: string;
  content: BlockContent<T>;
  answer: BlockAnswer<T>;
};

const MENU_OPTIONS: { label: string; value: EditFields }[] = [
  { label: "문제", value: EditFields.QUESTION },
  { label: "보기", value: EditFields.CONTENT },
  { label: "정답", value: EditFields.ANSWER },
  { label: "해설", value: EditFields.SOLUTION },
];

export function BlockEditAgent<T extends BlockType = BlockType>({
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
  const [blockSnapshot, setBlockSnapshot] = useState<BlockSnapshot<T> | null>(
    null,
  );
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
      setBlockSnapshot((prev) => prev ?? getCurrentSnapshot());

      if (toolCall.toolName === EDIT_FIELD_TOOL_NAMES.QUESTION) {
        const updatedQuestion = (toolCall.input as EditQuestionInput).question;
        onUpdateQuestion?.(updatedQuestion);
        return;
      }
      if (toolCall.toolName === EDIT_FIELD_TOOL_NAMES.CONTENT) {
        const updatedContent = toolCall.input as BlockContent<T>;
        onUpdateContent?.(updatedContent);
        return;
      }
      if (toolCall.toolName === EDIT_FIELD_TOOL_NAMES.ANSWER) {
        const updatedAnswer = toolCall.input as BlockAnswer<T>;
        onUpdateAnswer?.(updatedAnswer);
        return;
      }
      if (toolCall.toolName === EDIT_FIELD_TOOL_NAMES.SOLUTION) {
        const updatedSolution = (toolCall.input as EditSolutionInput).solution;
        onUpdateSolution?.(updatedSolution);
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

  const getCurrentSnapshot = useCallback(
    (): BlockSnapshot<T> => ({
      question,
      content,
      answer,
    }),
    [answer, content, question],
  );

  const isBusy = status === "submitted" || status === "streaming";

  const clearBuffers = useCallback(() => {
    setBlockSnapshot(null);
  }, []);

  const handleAccept = useCallback(() => {
    clearBuffers();
  }, [clearBuffers]);

  const handleReject = useCallback(() => {
    if (!blockSnapshot) return;
    onUpdateQuestion?.(blockSnapshot.question);
    onUpdateContent?.(blockSnapshot.content);
    onUpdateAnswer?.(blockSnapshot.answer);
    onUpdateSolution?.(blockSnapshot.answer?.solution ?? "");
    clearBuffers();
  }, [
    clearBuffers,
    onUpdateAnswer,
    onUpdateContent,
    onUpdateQuestion,
    onUpdateSolution,
    blockSnapshot,
  ]);

  const handleSendMessage = useCallback(
    (value: string) => {
      if (isBusy) return;
      setBlockSnapshot(getCurrentSnapshot());
      setMessages([]);
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: value }],
        metadata: {
          selectedMenuOptions,
        } as UIDataTypes,
      });
    },
    [getCurrentSnapshot, isBusy, selectedMenuOptions, sendMessage],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverPortal>
        <PopoverContent side="left" align="start" sideOffset={12}>
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
          {blockSnapshot && (
            <div className="mt-1 mr-2">
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                  onClick={handleAccept}
                  disabled={isBusy}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={handleReject}
                  disabled={isBusy || !blockSnapshot}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
