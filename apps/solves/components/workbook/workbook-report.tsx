"use client";

import { BlockContent, WorkBookWithoutBlocks } from "@service/solves/shared";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  HashIcon,
  HeartIcon,
  ListOrderedIcon,
  Settings2Icon,
  Share2Icon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toggleWorkBookPublicAction } from "@/actions/workbook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { notify } from "@/components/ui/notify";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCopy } from "@/hooks/use-copy";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { Counter } from "../ui/counter";
import { GradualSpacingText } from "../ui/gradual-spacing-text";
import { Block } from "./block/block";

export type BlockStat = {
  blockId: string;
  question: string;
  order: number;
  type: string;
  totalSubmits: number;
  correctCount: number;
  correctRate: number;
  content: BlockContent;
  answer: any;
};

export type WorkbookReportProps = {
  book: WorkBookWithoutBlocks;
  blockStats: BlockStat[];
  scoreDistribution: { range: string; count: number }[];
  dailySolves: { date: string; count: number }[];
};

function getBarColor(rate: number): string {
  // 앱 컬러 시스템 사용: --primary(correct), --point, --destructive(incorrect)
  if (rate >= 70) return "var(--primary)"; // 정답률 높음
  if (rate >= 40) return "var(--point)"; // 중간
  return "var(--destructive)"; // 정답률 낮음
}

export function WorkbookReport({
  book,
  blockStats,
  scoreDistribution,
  dailySolves,
}: WorkbookReportProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="h-full relative">
      <div className="h-full relative">
        <div className="max-w-5xl mx-auto pb-24 px-4 sm:px-6">
          <ReportHeader book={book} />
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-6 fade-1000"
          >
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full grid-cols-3 h-12 gap-1 bg-transparent">
                <TabsTrigger
                  className="hover:bg-secondary data-[state=active]:border-none data-[state=active]:shadow-none data-[state=active]:bg-secondary/80"
                  value="overview"
                >
                  통계 개요
                </TabsTrigger>
                <TabsTrigger
                  className="hover:bg-secondary data-[state=active]:border-none data-[state=active]:shadow-none data-[state=active]:bg-secondary/80"
                  value="questions"
                >
                  문제별 분석
                </TabsTrigger>
                <TabsTrigger
                  className="hover:bg-secondary data-[state=active]:border-none data-[state=active]:shadow-none data-[state=active]:bg-secondary/80"
                  value="settings"
                >
                  설정
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <OverviewTab
                book={book}
                blockStats={blockStats}
                scoreDistribution={scoreDistribution}
                dailySolves={dailySolves}
              />
            </TabsContent>

            <TabsContent value="questions" className="space-y-6">
              <QuestionsTab blockStats={blockStats} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <SettingsTab book={book} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ReportHeader({ book }: { book: WorkBookWithoutBlocks }) {
  return (
    <div className="py-8 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <GradualSpacingText text={book.title} />
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            <GradualSpacingText text={book.description || "설명이 없습니다."} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          {book.publishedAt && (
            <Badge variant="secondary" className="gap-1 h-7 bg-transparent">
              <CalendarIcon className="size-3" />
              {format(new Date(book.publishedAt), "yyyy년 M월 d일", {
                locale: ko,
              })}{" "}
              배포
            </Badge>
          )}
          {book.isPublic ? (
            <Badge variant="secondary" className="gap-1 h-7 bg-transparent">
              <EyeIcon className="size-3" /> 공개됨
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 h-7 bg-transparent">
              <EyeOffIcon className="size-3" /> 비공개
            </Badge>
          )}
        </div>
      </div>
      {book.tags && book.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {book.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="rounded-sm text-xs gap-0.5"
            >
              <HashIcon className="size-2.5" />
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewTab({
  book,
  blockStats,
  scoreDistribution,
  dailySolves,
}: {
  book: WorkBookWithoutBlocks;
  blockStats: BlockStat[];
  scoreDistribution: { range: string; count: number }[];
  dailySolves: { date: string; count: number }[];
}) {
  const averageScore = useMemo(() => {
    if (!book.firstSolverCount || book.firstSolverCount === 0) return 0;
    return Math.round((book.firstScoreSum ?? 0) / book.firstSolverCount);
  }, [book.firstScoreSum, book.firstSolverCount]);

  const sortedBlockStats = useMemo(() => {
    return [...blockStats]
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, 5);
  }, [blockStats]);

  // 점수 분포 차트 데이터 및 설정
  const scoreChartData = useMemo(() => {
    const rangeKeys = ["range1", "range2", "range3", "range4", "range5"];
    return scoreDistribution.map((item, index) => ({
      range: item.range,
      rangeKey: rangeKeys[index],
      count: item.count,
      fill: `var(--color-${rangeKeys[index]})`,
    }));
  }, [scoreDistribution]);

  const scoreChartConfig = {
    count: { label: "인원" },
    range1: { label: "0-20점", color: "var(--chart-1)" },
    range2: { label: "21-40점", color: "var(--chart-2)" },
    range3: { label: "41-60점", color: "var(--chart-3)" },
    range4: { label: "61-80점", color: "var(--chart-4)" },
    range5: { label: "81-100점", color: "var(--chart-5)" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6 fade-300">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="참여자 수"
          value={book.firstSolverCount ?? 0}
          suffix="명"
          icon={<UsersIcon className="size-4" />}
          description="문제집을 푼 총 인원"
        />
        <StatCard
          title="평균 점수"
          value={averageScore}
          suffix="%"
          icon={<TrophyIcon className="size-4" />}
          description="첫 제출 기준 평균"
        />
        <StatCard
          title="좋아요"
          value={book.likeCount ?? 0}
          suffix="개"
          icon={<HeartIcon className="size-4" />}
          description="받은 좋아요 수"
        />
        <StatCard
          title="문제 수"
          value={blockStats.length}
          suffix="개"
          icon={<ListOrderedIcon className="size-4" />}
          description="총 문제 개수"
        />
      </div>

      {/* 일자별 풀이 추이 차트 */}
      <Card className="border-none shadow-none bg-secondary/70">
        <CardHeader>
          <CardTitle>일자별 풀이 추이</CardTitle>
          <CardDescription>최근 30일간 풀이 현황입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySolves}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: "var(--primary)", strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(data.date), "yyyy년 M월 d일", {
                                locale: ko,
                              })}
                            </span>
                            <span className="font-semibold text-sm">
                              {data.count}명
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 점수 분포 차트 */}
        <Card className="col-span-1 border-none shadow-none bg-secondary/70">
          <CardHeader>
            <CardTitle>점수 분포</CardTitle>
            <CardDescription>참여자들의 점수 분포입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={scoreChartConfig}>
              <BarChart
                accessibilityLayer
                data={scoreChartData}
                layout="vertical"
                margin={{ left: 0 }}
              >
                <YAxis
                  dataKey="rangeKey"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    scoreChartConfig[value as keyof typeof scoreChartConfig]
                      ?.label as string
                  }
                />
                <XAxis dataKey="count" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" layout="vertical" radius={5} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 가장 어려운 문제 */}
        <Card className="col-span-1 border-none shadow-none bg-secondary/70">
          <CardHeader>
            <CardTitle>가장 어려운 문제</CardTitle>
            <CardDescription>
              정답률이 가장 낮은 문제 5개입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedBlockStats.map((stat) => (
                <div key={stat.blockId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <Badge
                        variant="outline"
                        className="w-14 justify-center rounded-full"
                      >
                        문제 {stat.order + 1}
                      </Badge>
                      <span className="truncate max-w-[200px] font-medium">
                        {stat.question || "문제 내용 없음"}
                      </span>
                    </div>
                    <span className="font-semibold text-muted-foreground">
                      <Counter value={stat.correctRate} suffix="%" />
                    </span>
                  </div>
                  <Progress
                    value={stat.correctRate}
                    className="h-2 bg-input"
                    indicatorColor={getBarColor(stat.correctRate)}
                  />
                </div>
              ))}
              {sortedBlockStats.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  데이터가 부족합니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuestionsTab({ blockStats }: { blockStats: BlockStat[] }) {
  return (
    <div className="space-y-8 fade-300">
      {blockStats.map((stat) => (
        <QuestionDetailCard key={stat.blockId} stat={stat} />
      ))}
      {blockStats.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          문제가 없습니다.
        </div>
      )}
    </div>
  );
}

function QuestionDetailCard({ stat }: { stat: BlockStat }) {
  return (
    <div className="space-y-4 p-4 border rounded-xl">
      {/* 문제 표시 - Block 컴포넌트 사용 */}
      <Block
        index={stat.order}
        mode="preview"
        type={stat.type as any}
        question={stat.question}
        content={stat.content}
        answer={stat.answer}
        id={stat.blockId}
        order={stat.order}
        className="shadow-none border-none bg-transparent"
      />

      {/* 문제 통계 */}
      <Card className="shadow-none  bg-secondary/70">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-sm font-medium text-muted-foreground">
                정답률
              </div>
              <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${stat.correctRate}%`,
                    backgroundColor: getBarColor(stat.correctRate),
                  }}
                />
              </div>
              <div
                className="text-lg font-bold min-w-[50px] text-right"
                style={{ color: getBarColor(stat.correctRate) }}
              >
                {stat.correctRate}%
              </div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">
                  {stat.totalSubmits}
                </div>
                <div className="">시도</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">
                  {stat.correctCount}
                </div>
                <div className="">정답</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">
                  {stat.totalSubmits - stat.correctCount}
                </div>
                <div className="">오답</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab({ book }: { book: WorkBookWithoutBlocks }) {
  const [copied, copy] = useCopy();
  const [isPublic, setIsPublic] = useState(book.isPublic);
  const router = useRouter();

  const [, togglePublic, isPending] = useSafeAction(
    toggleWorkBookPublicAction,
    {
      successMessage: (result) =>
        result.isPublic ? "공개로 변경되었습니다" : "비공개로 변경되었습니다",
      failMessage: "상태 변경에 실패했습니다",
      onSuccess: (result) => {
        setIsPublic(result.isPublic);
        router.refresh();
      },
    },
  );

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/workbooks/${book.id}/preview`;
  }, [book.id]);

  const handleCopyLink = useCallback(() => {
    copy(shareUrl);
  }, [shareUrl, copy]);

  const handleTogglePublic = useCallback(async () => {
    const confirmed = await notify.confirm({
      title: isPublic
        ? "비공개로 전환하시겠습니까?"
        : "공개로 전환하시겠습니까?",
      description: isPublic
        ? "비공개로 전환하면 다른 사용자들이 이 문제집을 볼 수 없게 됩니다."
        : "공개로 전환하면 모든 사용자들이 이 문제집을 볼 수 있습니다.",
      okText: isPublic ? "비공개로 전환" : "공개로 전환",
      cancelText: "취소",
    });

    if (!confirmed) return;

    togglePublic({ workBookId: book.id, isPublic: !isPublic });
  }, [book.id, isPublic, togglePublic]);

  return (
    <Card className="shadow-none fade-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2Icon className="size-5" />
          설정
        </CardTitle>
        <CardDescription>
          문제집의 공개 상태를 관리하고 공유 링크를 생성합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="space-y-1">
            <div className="font-medium flex items-center gap-2">
              <Share2Icon className="size-4 text-muted-foreground" />
              공유 링크
            </div>
            <div className="text-sm text-muted-foreground">
              친구들에게 문제집을 공유하세요.
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={handleCopyLink}
            disabled={copied}
          >
            {copied ? (
              <CheckIcon className="size-4 mr-2" />
            ) : (
              <CopyIcon className="size-4 mr-2" />
            )}
            {copied ? "복사됨" : "링크 복사"}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="space-y-1">
            <div className="font-medium flex items-center gap-2">
              {isPublic ? (
                <EyeIcon className="size-4 text-muted-foreground" />
              ) : (
                <EyeOffIcon className="size-4 text-muted-foreground" />
              )}
              공개 설정
            </div>
            <div className="text-sm text-muted-foreground">
              {isPublic
                ? "현재 누구나 이 문제집을 볼 수 있습니다."
                : "현재 나만 이 문제집을 볼 수 있습니다."}
            </div>
          </div>
          <Button
            variant={isPublic ? "secondary" : "default"}
            onClick={handleTogglePublic}
            disabled={isPending}
          >
            {isPublic ? "비공개로 전환" : "공개로 전환"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  suffix,
  icon,
  valueClassName,
  description,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon?: React.ReactNode;
  valueClassName?: string;
  description?: string;
}) {
  return (
    <Card className="border-none shadow-none bg-secondary/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>
          <Counter value={value} suffix={suffix} />
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
