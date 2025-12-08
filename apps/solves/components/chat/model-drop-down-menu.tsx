import { ChatModel } from "@service/solves/shared";
import { ChevronDownIcon, LoaderIcon } from "lucide-react";
import { PropsWithChildren, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModelProviderIcon } from "@/components/ui/model-provider-icon";
import { useChatModelList } from "@/hooks/query/use-chat-model-list";

type ModelDropDownProps = {
  defaultModel?: ChatModel;
  onModelChange?: (model: ChatModel) => void;
};

export function ModelDropDownMenu({
  defaultModel,
  children,
  onModelChange,
}: PropsWithChildren<ModelDropDownProps>) {
  const { data: modelList, isLoading } = useChatModelList();

  const selectedModel = useMemo(() => {
    return modelList?.find((model) => model.model === defaultModel?.model);
  }, [modelList, defaultModel]);

  const trigger = useMemo(() => {
    if (children) return children;
    return (
      <Button variant="outline">
        {selectedModel ? (
          <ModelProviderIcon
            provider={selectedModel.provider}
            className="size-4"
          />
        ) : null}
        {selectedModel?.displayName ?? "모델 선택"}
        <ChevronDownIcon className="size-4" />
      </Button>
    );
  }, [children, selectedModel]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
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
