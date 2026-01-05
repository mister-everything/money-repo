import { useChat } from "@ai-sdk/react";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { BlockAnswer, BlockContent, BlockType } from "@service/solves/shared";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { ReactNode, useMemo } from "react";
import z from "zod";
import { EditFields, WorkbookEditChatRequest } from "@/app/api/ai/shared";
import { Button } from "@/components/ui/button";
import JsonView from "@/components/ui/json-view";
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
  const { messages, sendMessage } = useChat({
    onError: handleErrorToast,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat/workbook/edit",
      prepareSendMessagesRequest: ({ messages, id }) => {
        const body: z.infer<typeof WorkbookEditChatRequest> =
          WorkbookEditChatRequest.parse({
            messages,
            model: useAiStore.getState().chatModel!,
            type,
            question,
            content,
            answer,
            editFields: [
              EditFields.QUESTION,
              EditFields.CONTENT,
              EditFields.ANSWER,
              EditFields.SOLUTION,
            ],
          });
        return {
          body,
        };
      },
    }),

    onFinish: ({ messages }) => {
      const lastMessage = messages.at(-1);
      if (lastMessage?.role !== "assistant") return;
      const toolParts = lastMessage?.parts.filter(isToolUIPart);
      console.log("toolParts", toolParts);
      toolParts?.forEach((part) => {
        if (part.type === `tool-${EDIT_FIELD_TOOL_NAMES.QUESTION}`) {
          const toolResult = part.input;
          onUpdateQuestion?.((toolResult as EditQuestionInput).question);
        }
        if (part.type === `tool-${EDIT_FIELD_TOOL_NAMES.CONTENT}`) {
          const toolResult = part.input;
          onUpdateContent?.(toolResult as BlockContent<T>);
        }
        if (part.type === `tool-${EDIT_FIELD_TOOL_NAMES.ANSWER}`) {
          const toolResult = part.input;
          onUpdateAnswer?.(toolResult as BlockAnswer<T>);
        }
        if (part.type === `tool-${EDIT_FIELD_TOOL_NAMES.SOLUTION}`) {
          const toolResult = part.input;
          onUpdateSolution?.((toolResult as EditSolutionInput).solution);
        }
      });
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverPortal>
        <PopoverContent className="bg-background border-border shadow-md w-[320px]">
          <div>
            <h1>Block Edit Agent</h1>
            <Button
              onClick={() =>
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: "문제 수정해주세요." }],
                })
              }
            >
              Send Message
            </Button>
            <div>
              <JsonView data={messages} />
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
