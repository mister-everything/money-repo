"use client";

import type { GatewayLanguageModelEntry } from "@ai-sdk/gateway";
import type { AIPrice } from "@service/solves/shared";
import { Loader, Search } from "lucide-react";
import { ReactNode, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useVercelGatewayPrices } from "@/hooks/query/use-vercel-gateway-prices";

interface AIPriceDialogProps {
  mode: "create" | "edit";
  initialData?: AIPrice;
  open?: boolean;
  originPrices?: {
    provider: string;
    model: string;
    displayName?: string;
    modelType: string;
    inputTokenPrice: string;
    outputTokenPrice: string;
    cachedTokenPrice: string;
  }[];
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  action: (
    prevState: any,
    formData: FormData,
  ) => Promise<{ success: boolean; errors?: any; message?: string }>;
}

export function AIPriceDialog({
  mode,
  initialData,
  open,
  children,
  onOpenChange,
  action,
}: AIPriceDialogProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Form states
  const [provider, setProvider] = useState(initialData?.provider ?? "");
  const [model, setModel] = useState(initialData?.model ?? "");
  const [displayName, setDisplayName] = useState(
    initialData?.displayName ?? "",
  );
  const [modelType, setModelType] = useState<string>(
    initialData?.modelType ?? "text",
  );
  const [inputTokenPrice, setInputTokenPrice] = useState(
    initialData?.inputTokenPrice ?? "",
  );
  const [outputTokenPrice, setOutputTokenPrice] = useState(
    initialData?.outputTokenPrice ?? "",
  );
  const [cachedTokenPrice, setCachedTokenPrice] = useState(
    initialData?.cachedTokenPrice ?? "",
  );
  const [markupRate, setMarkupRate] = useState(
    initialData?.markupRate ?? "1.60",
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const { data: gatewayPrices } = useVercelGatewayPrices();

  // Map modelType from gateway to our format
  const mapModelType = (gatewayType: string): string => {
    const mapping: Record<string, string> = {
      language: "text",
      embedding: "embedding",
      image: "image",
      audio: "audio",
      video: "video",
    };
    return mapping[gatewayType] || "text";
  };

  // Handle model selection from gateway
  const handleSelectModel = (gatewayModel: GatewayLanguageModelEntry) => {
    const [modelProvider, modelName] = gatewayModel.id.split("/");

    setProvider(modelProvider || "");
    setModel(modelName || "");
    setDisplayName(gatewayModel.name);
    setInputTokenPrice(gatewayModel.pricing?.input || "0");
    setOutputTokenPrice(gatewayModel.pricing?.output || "0");
    setCachedTokenPrice(
      gatewayModel.pricing?.cachedInputTokens ||
        gatewayModel.pricing?.cacheCreationInputTokens ||
        "0",
    );
    setModelType(mapModelType(gatewayModel.modelType || "language"));

    setIsSearchMode(false);
    toast.success(`${gatewayModel.name} 모델이 로드되었습니다.`);
  };

  // 성공 시 다이얼로그 닫기
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onOpenChange?.(false);
    } else if (state?.message) {
      toast.error(state.message);
    }
  }, [state, onOpenChange]);

  const getFieldError = (fieldName: string) => {
    return state?.errors?.[fieldName]?.[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isSearchMode
              ? "모델 검색"
              : mode === "create"
                ? "AI 가격 생성"
                : "AI 가격 수정"}
          </DialogTitle>
          <DialogDescription>
            {isSearchMode
              ? "Vercel Gateway에서 모델을 검색하고 선택하세요."
              : mode === "create"
                ? "새로운 AI 모델의 가격 정보를 입력하세요."
                : "AI 모델의 가격 정보를 수정하세요."}
          </DialogDescription>
        </DialogHeader>

        {isSearchMode ? (
          /* 검색 모드 */
          <div className="space-y-4">
            <Command className="rounded-lg border">
              <CommandInput placeholder="모델명 또는 제공자로 검색..." />
              <CommandList className="max-h-[500px]">
                <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                <CommandGroup heading="Available Models">
                  {gatewayPrices?.map((model) => (
                    <CommandItem
                      key={model.id}
                      onSelect={() => handleSelectModel(model)}
                      className="flex items-start gap-3 py-3 cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {model.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {model.id}
                          </span>
                        </div>
                        {model.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {model.description}
                          </p>
                        )}
                      </div>
                      {model.pricing && (
                        <div className="flex flex-col text-xs text-muted-foreground text-right">
                          {model.pricing.input && (
                            <span>In: ${model.pricing.input}/M</span>
                          )}
                          {model.pricing.output && (
                            <span>Out: ${model.pricing.output}/M</span>
                          )}
                        </div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSearchMode(false)}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          /* 폼 모드 */
          <form action={formAction} className="space-y-6">
            {/* 모델 불러오기 버튼 */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSearchMode(true)}
                disabled={isPending}
              >
                <Search className="size-4 mr-2" />
                Vercel Gateway에서 모델 불러오기
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Provider */}
              <div className="grid gap-2">
                <Label htmlFor="provider">AI 제공자</Label>
                <Input
                  id="provider"
                  name="provider"
                  placeholder="openai, anthropic, google"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  required
                />
                {getFieldError("provider") && (
                  <p className="text-sm text-destructive">
                    {getFieldError("provider")}
                  </p>
                )}
              </div>

              {/* Model */}
              <div className="grid gap-2">
                <Label htmlFor="model">모델명</Label>
                <Input
                  id="model"
                  name="model"
                  placeholder="gpt-4o-mini"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
                {getFieldError("model") && (
                  <p className="text-sm text-destructive">
                    {getFieldError("model")}
                  </p>
                )}
              </div>
            </div>

            {/* Display Name */}
            <div className="grid gap-2">
              <Label htmlFor="displayName">모델 표시명</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="GPT-4o mini"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              {getFieldError("displayName") && (
                <p className="text-sm text-destructive">
                  {getFieldError("displayName")}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                사용자에게 보이는 모델 이름
              </p>
            </div>

            {/* Model Type */}
            <div className="grid gap-2">
              <Label htmlFor="modelType">모델 타입</Label>
              <input type="hidden" name="modelType" value={modelType} />
              <Select value={modelType} onValueChange={setModelType}>
                <SelectTrigger>
                  <SelectValue placeholder="모델 타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text (텍스트)</SelectItem>
                  <SelectItem value="image">Image (이미지)</SelectItem>
                  <SelectItem value="audio">Audio (오디오)</SelectItem>
                  <SelectItem value="video">Video (비디오)</SelectItem>
                  <SelectItem value="embedding">Embedding (임베딩)</SelectItem>
                </SelectContent>
              </Select>
              {getFieldError("modelType") && (
                <p className="text-sm text-destructive">
                  {getFieldError("modelType")}
                </p>
              )}
            </div>

            {/* Token Prices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="inputTokenPrice">
                  입력 토큰 가격 ($/token)
                </Label>
                <Input
                  id="inputTokenPrice"
                  name="inputTokenPrice"
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000250"
                  value={inputTokenPrice}
                  onChange={(e) => setInputTokenPrice(e.target.value)}
                  required
                />
                {getFieldError("inputTokenPrice") && (
                  <p className="text-sm text-destructive">
                    {getFieldError("inputTokenPrice")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">토큰당 USD 단가</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="outputTokenPrice">
                  출력 토큰 가격 ($/token)
                </Label>
                <Input
                  id="outputTokenPrice"
                  name="outputTokenPrice"
                  type="number"
                  step="0.00000001"
                  placeholder="0.00001000"
                  value={outputTokenPrice}
                  onChange={(e) => setOutputTokenPrice(e.target.value)}
                  required
                />
                {getFieldError("outputTokenPrice") && (
                  <p className="text-sm text-destructive">
                    {getFieldError("outputTokenPrice")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">토큰당 USD 단가</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cachedTokenPrice">
                  캐시 토큰 가격 ($/token)
                </Label>
                <Input
                  id="cachedTokenPrice"
                  name="cachedTokenPrice"
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000125"
                  value={cachedTokenPrice}
                  onChange={(e) => setCachedTokenPrice(e.target.value)}
                  required
                />
                {getFieldError("cachedTokenPrice") && (
                  <p className="text-sm text-destructive">
                    {getFieldError("cachedTokenPrice")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  프롬프트 캐싱 할인가 (USD/token)
                </p>
              </div>
            </div>

            {/* Markup Rate */}
            <div className="grid gap-2">
              <Label htmlFor="markupRate">마진율</Label>
              <Input
                id="markupRate"
                name="markupRate"
                type="number"
                step="0.001"
                placeholder="1.60"
                value={markupRate}
                onChange={(e) => setMarkupRate(e.target.value)}
                required
              />
              {getFieldError("markupRate") && (
                <p className="text-sm text-destructive">
                  {getFieldError("markupRate")}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                고객 청구금액 = 원가 × 마진율 (예: 1.60 = 60% 마진)
              </p>
            </div>

            {/* Active Status */}
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-base">
                  가격 활성화
                </Label>
                <p className="text-sm text-muted-foreground">
                  비활성 모델은 가격 조회에서 제외됩니다.
                </p>
              </div>
              <input type="hidden" name="isActive" value={String(isActive)} />
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                disabled={isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader className="size-4 animate-spin" />
                ) : mode === "create" ? (
                  "생성"
                ) : (
                  "수정"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
