"use client";

import type { AIPrice } from "@service/solves/shared";
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  toggleAIPriceActiveAction,
  updateAIPriceAction,
} from "@/app/(dash-board)/solves/ai-prices/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/notify";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AIPriceDialog } from "./ai-price-dialog";

interface AIPriceTableProps {
  prices: AIPrice[];
}

export function AIPriceTable({ prices }: AIPriceTableProps) {
  const [editingPrice, setEditingPrice] = useState<AIPrice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const handleEdit = (price: AIPrice) => {
    setEditingPrice(price);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingPrice(null);
    router.refresh(); // Refresh server component data
  };

  const handleToggleActive = async (price: AIPrice) => {
    const newStatus = !price.isActive;
    const confirmed = await notify.confirm({
      title: newStatus ? "가격 활성화" : "가격 비활성화",
      description: newStatus
        ? "이 가격을 활성화하시겠습니까?"
        : "이 가격을 비활성화하시겠습니까? 비활성 모델은 가격 조회에서 제외됩니다.",
      okText: newStatus ? "활성화" : "비활성화",
      cancelText: "취소",
    });

    if (confirmed) {
      try {
        await toggleAIPriceActiveAction(price.id, newStatus);
        toast.success(
          newStatus ? "가격이 활성화되었습니다." : "가격이 비활성화되었습니다.",
        );
        router.refresh(); // Refresh server component data
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "작업에 실패했습니다.",
        );
      }
    }
  };

  const formatPrice = (price: string) => {
    return Number(price).toLocaleString("ko-KR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제공자</TableHead>
              <TableHead>모델</TableHead>
              <TableHead>타입</TableHead>
              <TableHead className="text-right">입력 토큰</TableHead>
              <TableHead className="text-right">출력 토큰</TableHead>
              <TableHead className="text-right">캐시 토큰</TableHead>
              <TableHead className="text-right">마진율</TableHead>
              <TableHead className="text-center">활성화</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">
                    등록된 AI 가격이 없습니다.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              prices.map((price) => (
                <TableRow key={price.id}>
                  <TableCell className="font-medium">
                    {price.provider}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{price.model}</span>
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
                  <TableCell className="text-right font-mono text-sm">
                    ₩{formatPrice(price.inputTokenPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ₩{formatPrice(price.outputTokenPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ₩{formatPrice(price.cachedTokenPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {price.markupRate}×
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={price.isActive}
                      onCheckedChange={() => handleToggleActive(price)}
                    />
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
          action={updateAIPriceAction.bind(null, editingPrice.id)}
        />
      )}
    </>
  );
}
