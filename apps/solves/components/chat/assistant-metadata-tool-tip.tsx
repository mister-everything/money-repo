import { AssistantMessageMetadata } from "@service/solves/shared";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ModelProviderIcon } from "../ui/model-provider-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function AssistantMetadataToolTip({
  metadata,
  children,
  side,
  align,
  className,
}: {
  metadata: AssistantMessageMetadata;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        className={cn("p-4 w-72 ", className)}
      >
        <div className="space-y-4">
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">모델</h4>
              <div className="flex gap-3 items-center">
                <ModelProviderIcon
                  provider={metadata.provider || ""}
                  className="size-5 shrink-0"
                />
                <div className="space-y-0.5 flex-1">
                  <div className="text-sm font-medium">{metadata.provider}</div>
                  <div className="text-xs text-muted-foreground">
                    {metadata.model || "알수없음"}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-border/50" />
          </>

          <>
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                토큰 사용량
              </h4>
              <div className="space-y-2">
                {metadata.input !== undefined && (
                  <div className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/30">
                    <span className="text-xs text-muted-foreground">입력</span>
                    <span className="text-xs font-mono font-medium">
                      {metadata.input.toLocaleString()}
                    </span>
                  </div>
                )}
                {metadata.output !== undefined && (
                  <div className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/30">
                    <span className="text-xs text-muted-foreground">출력</span>
                    <span className="text-xs font-mono font-medium">
                      {metadata.output.toLocaleString()}
                    </span>
                  </div>
                )}
                {metadata.cost !== undefined && (
                  <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-primary/10 border border-primary/20">
                    <span className="text-xs font-medium text-primary">
                      비용
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">
                      {(metadata.cost * 1450).toLocaleString()}원
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
