import { ChatModel } from "@service/solves/shared";
import { ChevronDownIcon, LoaderIcon } from "lucide-react";
import { PropsWithChildren, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModelProviderIcon } from "@/components/ui/model-provider-icon";
import { useChatModelList } from "@/hooks/query/use-chat-model-list";
import { useAiStore } from "@/store/ai-store";

type ModelDropDownProps = {
  defaultModel?: ChatModel;
  align?: "start" | "end" | "center";
  side?: "bottom" | "top" | "left" | "right";
  onModelChange?: (model: ChatModel) => void;
};

export function ModelDropDownMenu({
  defaultModel,
  align,
  side,
  children,
  onModelChange,
}: PropsWithChildren<ModelDropDownProps>) {
  const { data: modelList, isLoading } = useChatModelList();

  const { chatModel, setChatModel } = useAiStore();

  const selectedModel = useMemo(() => {
    const m = defaultModel || chatModel;
    return modelList?.find((model) => model.model === m?.model);
  }, [modelList, defaultModel, chatModel]);

  const handleModelChange = useCallback(
    (model: ChatModel) => {
      if (onModelChange) onModelChange(model);
      else setChatModel(model);
    },
    [setChatModel, onModelChange],
  );

  const trigger = useMemo(() => {
    if (children) return children;
    return (
      <Button
        variant={"ghost"}
        size={"sm"}
        className="group data-[state=open]:bg-input! hover:bg-input! mr-1"
        data-testid="model-selector-button"
      >
        {isLoading ? (
          <LoaderIcon className="size-4 animate-spin" />
        ) : (
          <>
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

            <ChevronDownIcon className="size-3 group-data-[state=open]:rotate-180 transition-transform duration-200" />
          </>
        )}
      </Button>
    );
  }, [children, selectedModel, isLoading]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-96" align={align} side={side}>
        {isLoading ? (
          <LoaderIcon className="size-4 animate-spin" />
        ) : (
          modelList?.map((model) => (
            <DropdownMenuItem
              key={`${model.provider}-${model.model}`}
              onClick={() => handleModelChange(model)}
            >
              <ModelProviderIcon provider={model.provider} className="size-4" />
              {model.displayName}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
