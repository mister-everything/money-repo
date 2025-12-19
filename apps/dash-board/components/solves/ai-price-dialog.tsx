"use client";

import type { GatewayLanguageModelEntry } from "@ai-sdk/gateway";
import type { AIPrice } from "@service/solves/shared";
import { ChevronLeft, Loader, Search } from "lucide-react";
import { ReactNode, useState } from "react";
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
import { SafeFunction } from "@/lib/protocol/interface";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

function toMillion(price: string) {
  return (Number(price) * 1_000_000).toFixed(2);
}

type AIPriceCreateData = {
  provider: string;
  model: string;
  displayName: string;
  modelType: "text" | "image" | "audio" | "video" | "embedding";
  inputTokenPrice: string;
  outputTokenPrice: string;
  cachedTokenPrice: string;
  markupRate: string;
  isActive: boolean;
  maxContext: number | null;
};

type AIPriceUpdateData = AIPriceCreateData & {
  id: string;
};

interface AIPriceDialogBaseProps {
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
}

type AIPriceDialogProps = AIPriceDialogBaseProps &
  (
    | { mode: "create"; action: SafeFunction<AIPriceCreateData, any> }
    | { mode: "edit"; action: SafeFunction<AIPriceUpdateData, any> }
  );

export function AIPriceDialog({
  mode,
  initialData,
  open,
  children,
  onOpenChange,
  action,
}: AIPriceDialogProps) {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

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
  const [maxContext, setMaxContext] = useState<number | null>(
    initialData?.maxContext ?? null,
  );

  const [, executeAction, isPending] = useSafeAction(action, {
    onSuccess: () => {
      toast.success(
        mode === "create"
          ? "AI 가격이 생성되었습니다."
          : "AI 가격이 수정되었습니다.",
      );
      setErrors(null);
      onOpenChange?.(false);
    },
    onError: (error) => {
      toast.error(error.message || "저장에 실패했습니다.");
      if (error.fields) {
        // Filter out undefined values from fields
        const filteredFields: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(error.fields)) {
          if (value) {
            filteredFields[key] = value;
          }
        }
        setErrors(filteredFields);
      }
    },
  });

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
    setMaxContext(gatewayModel.maxContextLength ?? null);

    setIsSearchMode(false);
    toast.success(`${gatewayModel.name} 모델이 로드되었습니다.`);
  };

  const handleSubmit = () => {
    const baseData = {
      provider,
      model,
      displayName,
      modelType: modelType as AIPriceCreateData["modelType"],
      inputTokenPrice,
      outputTokenPrice,
      cachedTokenPrice,
      markupRate,
      isActive,
      maxContext,
    };

    if (mode === "edit" && initialData?.id) {
      executeAction({ ...baseData, id: initialData.id } as any);
    } else {
      executeAction(baseData as any);
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors?.[fieldName]?.[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}

      <DialogContent className="max-w-4xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isSearchMode
              ? "모델 검색"
              : mode === "create"
                ? "AI 가격 생성"
                : "AI 가격 수정"}
          </DialogTitle>
          <div className="flex items-center justify-between">
            <DialogDescription>
              새로운 AI 모델의 가격 정보를 입력하세요.
            </DialogDescription>

            <Button
              type="button"
              variant={isSearchMode ? "ghost" : "outline"}
              size="sm"
              onClick={() => setIsSearchMode((prev) => !prev)}
              disabled={isPending}
            >
              {isSearchMode ? (
                <>
                  <ChevronLeft />
                  뒤로가기
                </>
              ) : (
                <>
                  <Search className="size-4 mr-2" />
                  모델 불러오기
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {isSearchMode ? (
          /* 검색 모드 */
          <Command className="rounded-lg bg-background">
            <CommandInput placeholder="모델명 또는 제공자로 검색..." />
            <CommandList className="max-h-[500px]">
              <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
              <CommandGroup>
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
                          <span>
                            In: ${toMillion(model.pricing.input)}/M (1450원
                            기준: $
                            {(
                              Number(toMillion(model.pricing.input)) * 1450
                            ).toFixed(2)}
                            원)
                          </span>
                        )}
                        {model.pricing.output && (
                          <span>
                            Out: ${toMillion(model.pricing.output)}/M (1450원
                            기준: $
                            {(
                              Number(toMillion(model.pricing.output)) * 1450
                            ).toFixed(2)}
                            원)
                          </span>
                        )}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          /* 폼 모드 */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Provider */}
              <div className="grid gap-2">
                <Label htmlFor="provider">AI 제공자</Label>
                <Input
                  id="provider"
                  placeholder="openai, anthropic, google"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
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
                  placeholder="gpt-4o-mini"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
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
                placeholder="GPT-4o mini"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000250"
                  value={inputTokenPrice}
                  onChange={(e) => setInputTokenPrice(e.target.value)}
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
                  type="number"
                  step="0.00000001"
                  placeholder="0.00001000"
                  value={outputTokenPrice}
                  onChange={(e) => setOutputTokenPrice(e.target.value)}
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
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000125"
                  value={cachedTokenPrice}
                  onChange={(e) => setCachedTokenPrice(e.target.value)}
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

            {/* Markup Rate & Max Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="markupRate">마진율</Label>
                <Input
                  id="markupRate"
                  type="number"
                  step="0.001"
                  placeholder="1.60"
                  value={markupRate}
                  onChange={(e) => setMarkupRate(e.target.value)}
                />
                {getFieldError("markupRate") && (
                  <p className="text-sm text-destructive">
                    {getFieldError("markupRate")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  고객 청구금액 = 원가 × 마진율 (예: 1.60 = 60% 마진)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxContext">최대 컨텍스트 (토큰)</Label>
                <Input
                  id="maxContext"
                  type="number"
                  step="1000"
                  placeholder="128000"
                  value={maxContext ?? ""}
                  onChange={(e) =>
                    setMaxContext(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
                {getFieldError("maxContext") && (
                  <p className="text-sm text-destructive">
                    {getFieldError("maxContext")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {maxContext
                    ? `${Math.round(maxContext / 1000)}k 토큰`
                    : "컨텍스트 길이 미설정"}
                </p>
              </div>
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
              <Button type="button" onClick={handleSubmit} disabled={isPending}>
                {isPending ? (
                  <Loader className="size-4 animate-spin" />
                ) : mode === "create" ? (
                  "생성"
                ) : (
                  "수정"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
