import { useChat } from "@ai-sdk/react";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { BlockAnswer, BlockContent, BlockType } from "@service/solves/shared";
import { DefaultChatTransport } from "ai";
import { ReactNode } from "react";
import z from "zod";
import { EditFields, WorkbookEditChatRequest } from "@/app/api/ai/shared";
import { Button } from "@/components/ui/button";
import JsonView from "@/components/ui/json-view";
import { handleErrorToast } from "@/lib/handle-toast";
import { useAiStore } from "@/store/ai-store";

type Props<T extends BlockType = BlockType> = {
  children: ReactNode;
  type: T;
  question: string;
  content: BlockContent<T>;
  answer: BlockAnswer<T>;
};
export function BlockEditAgent<T extends BlockType = BlockType>({
  children,
  type,
  question,
  content,
  answer,
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
