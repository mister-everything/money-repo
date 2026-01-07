"use client";

import { ReportCategoryMain, ReportStatus } from "@service/report/shared";
import {
  AlertCircle,
  AlertTriangle,
  FileWarning,
  Filter,
  Flame,
  Search,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportsFiltersProps {
  defaultSearch?: string;
  defaultCategoryMain?: ReportCategoryMain;
  defaultStatus?: ReportStatus;
  defaultPriorityOnly?: boolean;
}

export function ReportsFilters({
  defaultSearch = "",
  defaultCategoryMain,
  defaultStatus,
  defaultPriorityOnly = false,
}: ReportsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(defaultSearch);
  const [categoryMain, setCategoryMain] = useState<string>(
    defaultCategoryMain || "all"
  );
  const [status, setStatus] = useState<string>(defaultStatus || "all");
  const [priorityOnly, setPriorityOnly] = useState(defaultPriorityOnly);

  // 임시 나중에 수정
  const updateUrl = useCallback(
    (updates: Record<string, string | boolean | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page"); // 필터 변경 시 1페이지로

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else if (typeof value === "boolean") {
          if (value) {
            params.set(key, "true");
          } else {
            params.delete(key);
          }
        } else {
          params.set(key, value);
        }
      }

      startTransition(() => {
        router.push(`/solves/reports?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search });
  };

  const handleCategoryChange = (value: string) => {
    setCategoryMain(value);
    updateUrl({
      categoryMain: value === "all" ? undefined : value,
      search,
      status: status === "all" ? undefined : status,
      priorityOnly,
    });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    updateUrl({
      status: value === "all" ? undefined : value,
      search,
      categoryMain: categoryMain === "all" ? undefined : categoryMain,
      priorityOnly,
    });
  };

  const handlePriorityToggle = () => {
    const newValue = !priorityOnly;
    setPriorityOnly(newValue);
    updateUrl({
      priorityOnly: newValue,
      search,
      categoryMain: categoryMain === "all" ? undefined : categoryMain,
      status: status === "all" ? undefined : status,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          필터
          {isPending && (
            <span className="text-sm font-normal text-muted-foreground">
              로딩중...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="대상 ID, 내용으로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="secondary">
                검색
              </Button>
            </div>
          </form>

          <Select value={categoryMain} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              <SelectItem value={ReportCategoryMain.ERROR}>
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  오류
                </span>
              </SelectItem>
              <SelectItem value={ReportCategoryMain.VIOLATION}>
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  위반
                </span>
              </SelectItem>
              <SelectItem value={ReportCategoryMain.OTHER}>
                <span className="flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-gray-500" />
                  기타
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value={ReportStatus.RECEIVED}>접수됨</SelectItem>
              <SelectItem value={ReportStatus.IN_REVIEW}>검토중</SelectItem>
              <SelectItem value={ReportStatus.RESOLVED}>처리완료</SelectItem>
              <SelectItem value={ReportStatus.REJECTED}>반려</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={priorityOnly ? "default" : "outline"}
            onClick={handlePriorityToggle}
            className="gap-2"
          >
            <Flame
              className={`h-4 w-4 ${
                priorityOnly ? "text-white" : "text-red-500"
              }`}
            />
            우선 검토만
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
