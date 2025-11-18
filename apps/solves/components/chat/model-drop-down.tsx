import { AIPrice, ChatModel } from "@service/solves/shared";
import { TIME } from "@workspace/util";
import { LoaderIcon } from "lucide-react";
import { PropsWithChildren } from "react";
import useSWR from "swr";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type ModelDropDownProps = {
  defaultModel?: ChatModel;
  onModelChange?: (model: ChatModel) => void;
};

export function ModelDropDown({
  children,
  onModelChange,
}: PropsWithChildren<ModelDropDownProps>) {
  const { data: modelList, isLoading } = useSWR<
    Pick<AIPrice, "provider" | "model" | "displayName">[]
  >("/api/ai/chat/models", {
    fallbackData: [],
    revalidateOnFocus: false,
    dedupingInterval: TIME.MINUTES(10),
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-96">
        {isLoading ? (
          <LoaderIcon className="size-4 animate-spin" />
        ) : (
          modelList?.map((model) => (
            <DropdownMenuItem
              key={`${model.provider}-${model.model}`}
              onClick={() => onModelChange?.(model)}
            >
              {model.displayName}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
