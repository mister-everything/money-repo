"use client";

import type { AIPrice } from "@service/solves/shared";
import { Check, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  setDefaultModelAction,
  updateAIPriceAction,
} from "@/app/(dash-board)/solves/ai-prices/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useVercelGatewayPrices } from "@/hooks/query/use-vercel-gateway-prices";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { AIPriceDialog } from "./ai-price-dialog";

interface AIPriceTableProps {
  prices: AIPrice[];
}

export function AIPriceTable({ prices }: AIPriceTableProps) {
  const [editingPrice, setEditingPrice] = useState<AIPrice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const [, setDefaultModel, isSettingDefault] = useSafeAction(
    setDefaultModelAction,
    {
      onSuccess: () => {
        toast.success("기본 모델이 설정되었습니다.");
        router.refresh();
      },
      failMessage: "기본 모델 설정에 실패했습니다.",
    },
  );

  const { data: gatewayPrices } = useVercelGatewayPrices();

  const gatewayPricesMap = useMemo(() => {
    return new Map(gatewayPrices?.map((p) => [p.id, p]) ?? []);
  }, [gatewayPrices]);

  const pricesWithGatewayPrices = useMemo(() => {
    return prices.map((price) => {
      const key = price.provider + "/" + price.model;
      const gatewayPrice = gatewayPricesMap.get(key);
      return {
        ...price,
        providerInputTokenPrice: gatewayPrice?.pricing?.input,
        providerOutputTokenPrice: gatewayPrice?.pricing?.output,
        providerCachedTokenPrice: gatewayPrice?.pricing?.cachedInputTokens,
      };
    });
  }, [prices, gatewayPricesMap]);

  const handleEdit = (price: AIPrice) => {
    setEditingPrice(price);
    setIsDialogOpen(true);
  };

  const handleDialogClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setIsDialogOpen(false);
        setEditingPrice(null);
        router.refresh(); // Refresh server component data
      }
    },
    [router],
  );

  const formatPrice = (price: number) => {
    // Convert to per M tokens (multiply by 1,000,000)
    return (price * 1000000).toFixed(2);
  };

  const calculateFinalPrice = (basePrice: string, markupRate: string) => {
    const base = Number(basePrice);
    const markup = Number(markupRate);
    return base * markup;
  };

  const getModelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: "텍스트",
      image: "이미지",
      audio: "오디오",
      video: "비디오",
      embedding: "임베딩",
    };
    return labels[type] || type;
  };

  const hasPriceDiff = (currentPrice: string, providerPrice?: string) => {
    return providerPrice && Number(currentPrice) !== Number(providerPrice);
  };

  const getPriceDiffTooltip = (
    currentPrice: string,
    providerPrice: string,
    tokenType: string,
  ) => {
    const current = formatPrice(Number(currentPrice));
    const provider = formatPrice(Number(providerPrice));
    return `${tokenType} 토큰\nVercel Gateway: $${provider}/M\n현재 가격: $${current}/M\n원화(1450원 기준): ${Number(current) * 1450}원`;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>제공자</TableHead>
              <TableHead>모델</TableHead>
              <TableHead>타입</TableHead>
              <TableHead className="text-center">기본</TableHead>
              <TableHead>입력 토큰</TableHead>
              <TableHead>출력 토큰</TableHead>
              <TableHead>캐시 토큰</TableHead>
              <TableHead>마진율</TableHead>
              <TableHead>컨텍스트</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pricesWithGatewayPrices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  <p className="text-muted-foreground">
                    등록된 AI 가격이 없습니다.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              pricesWithGatewayPrices.map((price) => (
                <TableRow key={price.id}>
                  <TableCell className="font-medium text-center">
                    {price.displayName}
                  </TableCell>
                  <TableCell className="font-medium text-center">
                    {price.provider}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{price.model}</span>
                      {!price.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          비활성
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getModelTypeLabel(price.modelType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant={price.isDefaultModel ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8 disabled:opacity-100"
                      disabled={isSettingDefault || price.isDefaultModel}
                      onClick={() =>
                        setDefaultModel({
                          priceId: price.id,
                          modelType: price.modelType,
                        })
                      }
                    >
                      <Check
                        className={`h-4 w-4 ${price.isDefaultModel ? "text-white" : "text-muted-foreground"}`}
                      />
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-end gap-1">
                            {hasPriceDiff(
                              price.inputTokenPrice,
                              price.providerInputTokenPrice,
                            ) && (
                              <div className="w-2 h-2 rounded-full bg-destructive" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              원가: $
                              {formatPrice(Number(price.inputTokenPrice))}
                              /M
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            판매: $
                            {formatPrice(
                              calculateFinalPrice(
                                price.inputTokenPrice,
                                price.markupRate,
                              ),
                            )}
                            /M
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="whitespace-pre-line">
                        <div className="text-xs">
                          {price.providerInputTokenPrice &&
                            getPriceDiffTooltip(
                              price.inputTokenPrice,
                              price.providerInputTokenPrice,
                              "입력",
                            )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-end gap-1">
                            {hasPriceDiff(
                              price.outputTokenPrice,
                              price.providerOutputTokenPrice,
                            ) && (
                              <div className="w-2 h-2 rounded-full bg-destructive" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              원가: $
                              {formatPrice(Number(price.outputTokenPrice))}
                              /M
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            판매: $
                            {formatPrice(
                              calculateFinalPrice(
                                price.outputTokenPrice,
                                price.markupRate,
                              ),
                            )}
                            /M
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="whitespace-pre-line">
                        <div className="text-xs">
                          {price.providerOutputTokenPrice &&
                            getPriceDiffTooltip(
                              price.outputTokenPrice,
                              price.providerOutputTokenPrice,
                              "출력",
                            )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-end gap-1">
                            {hasPriceDiff(
                              price.cachedTokenPrice,
                              price.providerCachedTokenPrice,
                            ) && (
                              <div className="w-2 h-2 rounded-full bg-destructive" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              원가: $
                              {formatPrice(Number(price.cachedTokenPrice))}
                              /M
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            판매: $
                            {formatPrice(
                              calculateFinalPrice(
                                price.cachedTokenPrice,
                                price.markupRate,
                              ),
                            )}
                            /M
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="whitespace-pre-line">
                        <div className="text-xs">
                          {price.providerCachedTokenPrice &&
                            getPriceDiffTooltip(
                              price.cachedTokenPrice,
                              price.providerCachedTokenPrice,
                              "캐시",
                            )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {price.markupRate}×
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {price.maxContext
                      ? `${Math.round(price.maxContext / 1000)}k`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(price)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingPrice && (
        <AIPriceDialog
          mode="edit"
          initialData={editingPrice}
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          action={updateAIPriceAction}
        />
      )}
    </>
  );
}
