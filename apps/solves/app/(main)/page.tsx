import { workBookService } from "@service/solves";
import {
  Bot,
  BrainIcon,
  GlobeIcon,
  Library,
  MessageCircleQuestion,
  PlayCircleIcon,
  Share2Icon,
  TrophyIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PolicyFooter } from "@/components/layouts/policy-footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { WorkbookCarousel } from "@/components/workbook/workbook-carousel";
import { MockAiSolver } from "./_components/mock-ai-solver";
import { MockAskInteraction } from "./_components/mock-ask-interaction";
import { MockSimulation } from "./_components/mock-simulation";
import { MockUserSolver } from "./_components/mock-user-solver";
import * as Motion from "./_components/motion-wrapper";

export default async function Page() {
  const workBooks = await workBookService.searchWorkBooks({
    isPublished: true,
    limit: 10,
  });

  return (
    <div className="flex flex-col w-full gap-0 pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-[85vh] w-full flex flex-col items-center justify-center overflow-hidden">
        <div className="z-10 flex flex-col items-center text-center gap-8 p-4 mt-10 max-w-4xl mx-auto">
          <Motion.FadeIn>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-2">
              <GradualSpacingText
                duration={0.8}
                delayMultiple={0.05}
                text="호기심이 문제가 되는 순간,"
              />
            </h1>
          </Motion.FadeIn>

          <Motion.FadeIn delay={0.5}>
            <div className="relative">
              <h2 className="text-5xl md:text-8xl font-black bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/50">
                Solves<span className="text-primary">.</span>
              </h2>
            </div>
          </Motion.FadeIn>

          <Motion.FadeIn delay={0.8}>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              AI와 함께 만드는 나만의 지식 놀이터.
              <br />
              상상하던 모든 것을 문제집으로 만들어보세요.
            </p>
          </Motion.FadeIn>

          <Motion.FadeIn delay={1.0}>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link href="/workbooks/creator/new">
                <Button
                  size="lg"
                  className="rounded-full text-lg h-14 px-10 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                >
                  문제집 만들기
                </Button>
              </Link>
              <Link href="/workbooks">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full text-lg h-14 px-10 backdrop-blur-sm bg-background/50 hover:bg-background/80"
                >
                  둘러보기
                </Button>
              </Link>
            </div>
          </Motion.FadeIn>
        </div>
      </section>

      {/* Interactive Simulation Section (Maker) */}
      <section className="py-24 container mx-auto px-6">
        <div className="flex flex-col xl:flex-row items-center gap-12 xl:gap-24">
          {/* Text Content */}
          <Motion.SlideIn
            direction="left"
            className="flex-1 space-y-8 max-w-2xl xl:text-left text-center"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary w-fit mx-auto xl:mx-0">
                <Bot className="mr-2 size-4" />
                AI Interactive Maker
              </div>
              <h3 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
                대화하듯 만드는
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-500">
                  나만의 문제집
                </span>
              </h3>
            </div>

            <p className="text-xl text-muted-foreground leading-relaxed">
              "역사 상식 퀴즈 문제집 만들어줘"
              <br className="hidden md:block" />한 마디면 충분합니다. Solves
              AI가 주제를 분석하고 <br className="hidden md:block" />
              핵심 문제부터 제목, 설명까지 제안해드립니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted">
                <div className="bg-background p-2 rounded-lg text-primary">
                  <Bot className="size-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">자동 문제 생성</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    주제에 맞는 객관식, OX, 단답형 문제를 AI가 생성합니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted">
                <div className="bg-background p-2 rounded-lg text-primary">
                  <Library className="size-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">메타데이터 제안</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    어울리는 제목과 설명을 AI가 여러 가지 버전으로 제안합니다.
                  </p>
                </div>
              </div>
            </div>
          </Motion.SlideIn>

          {/* Simulation Component */}
          <Motion.SlideIn
            direction="right"
            className="flex-1 w-full flex justify-center xl:justify-end"
          >
            <div className="relative w-full max-w-[500px]">
              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 size-32 bg-primary/20 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-10 -left-10 size-32 bg-purple-500/20 rounded-full blur-3xl opacity-50" />

              <MockSimulation />
            </div>
          </Motion.SlideIn>
        </div>
      </section>

      {/* Ask Interaction Section - AI Asks Questions */}
      <section className="py-24 w-full">
        <div className="container mx-auto px-6">
          <div className="flex flex-col xl:flex-row-reverse items-center justify-between gap-12 xl:gap-24">
            {/* Text Content */}
            <Motion.SlideIn
              direction="right"
              className="flex-1 space-y-6 xl:text-left text-center max-w-xl"
            >
              <div className="inline-flex items-center rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-500 w-fit mx-auto xl:mx-0">
                <MessageCircleQuestion className="mr-2 size-4" />
                Smart Question Flow
              </div>
              <h3 className="text-3xl md:text-5xl font-bold leading-tight">
                AI가 물어봐요
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-cyan-500">
                  정확한 문제 제작
                </span>
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                "과학 문제 만들어줘"처럼 넓은 주제를 말해도 괜찮아요.
                <br />
                AI가{" "}
                <span className="text-foreground font-medium">
                  분야, 난이도, 문제 유형
                </span>
                을 차례로 물어보며
                <br />
                당신이 원하는 정확한 문제를 만들어드립니다.
              </p>
              <div className="flex flex-wrap gap-2 justify-center xl:justify-start pt-2">
                <span className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium">
                  🎯 맞춤형 질문
                </span>
                <span className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-medium">
                  ⚡ 빠른 조건 설정
                </span>
                <span className="px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-600 text-xs font-medium">
                  🧠 스마트 추천
                </span>
              </div>
            </Motion.SlideIn>

            {/* Simulation Component */}
            <Motion.SlideIn
              direction="left"
              className="flex-1 w-full flex justify-center xl:justify-start"
            >
              <div className="relative w-full max-w-sm">
                <div className="absolute -inset-2 bg-linear-to-r from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-20" />
                <MockAskInteraction />
              </div>
            </Motion.SlideIn>
          </div>
        </div>
      </section>

      {/* User Solver Section - User Solves Problems */}
      <section className="py-24 container mx-auto px-6">
        <div className="flex flex-col xl:flex-row items-center gap-12 xl:gap-24">
          {/* Text Content */}
          <Motion.SlideIn
            direction="left"
            className="flex-1 space-y-6 xl:text-left text-center max-w-xl"
          >
            <div className="inline-flex items-center rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-600 w-fit mx-auto xl:mx-0">
              <PlayCircleIcon className="mr-2 size-4" />
              Interactive Learning
            </div>
            <h3 className="text-3xl md:text-5xl font-bold leading-tight">
              직접 풀어보세요
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-green-500 to-emerald-500">
                인터랙티브 학습
              </span>
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              책상 위의 문제집은 잊으세요.
              <br />
              클릭 한 번으로 정답을 확인하고,{" "}
              <span className="text-foreground font-medium">
                즉각적인 피드백
              </span>
              을 받으세요.
              <br />
              게임처럼 재미있게 학습할 수 있습니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <div className="size-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrophyIcon className="size-4 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">점수 & 랭킹</p>
                  <p className="text-xs text-muted-foreground">
                    풀이 결과를 점수로 확인
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Share2Icon className="size-4 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">결과 공유</p>
                  <p className="text-xs text-muted-foreground">
                    친구들과 점수를 비교
                  </p>
                </div>
              </div>
            </div>
          </Motion.SlideIn>

          {/* Simulation Component */}
          <Motion.SlideIn
            direction="right"
            className="flex-1 w-full flex justify-center xl:justify-end"
          >
            <div className="relative">
              <div className="absolute -top-10 -right-10 size-32 bg-green-500/20 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-10 -left-10 size-32 bg-emerald-500/20 rounded-full blur-3xl opacity-50" />
              <MockUserSolver />
            </div>
          </Motion.SlideIn>
        </div>
      </section>

      {/* AI Solver Section - AI Solves Problems */}
      <section className="py-24 w-full">
        <div className="container mx-auto px-6">
          <div className="flex flex-col xl:flex-row-reverse items-center gap-12 xl:gap-24">
            {/* Text Content */}
            <Motion.SlideIn
              direction="right"
              className="flex-1 space-y-6 xl:text-left text-center max-w-xl"
            >
              <div className="inline-flex items-center rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-600 w-fit mx-auto xl:mx-0">
                <BrainIcon className="mr-2 size-4" />
                AI Problem Solver
              </div>
              <h3 className="text-3xl md:text-5xl font-bold leading-tight">
                AI가 문제를 풀어요
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-500">
                  사고과정까지 공개
                </span>
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                AI가 문제를 어떻게 푸는지 궁금하셨나요?
                <br />
                <span className="text-foreground font-medium">
                  웹 검색부터 실시간 사고과정
                </span>
                까지 보여드립니다.
                <br />
                AI의 풀이를 참고해 더 깊이 있는 학습이 가능해요.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-background">
                  <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <GlobeIcon className="size-4 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">웹 검색</p>
                    <p className="text-xs text-muted-foreground">
                      실시간 정보를 검색하며 풀이
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-background">
                  <div className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <BrainIcon className="size-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">사고 과정</p>
                    <p className="text-xs text-muted-foreground">
                      한 글자씩 스트리밍되는 분석
                    </p>
                  </div>
                </div>
              </div>
            </Motion.SlideIn>

            {/* Simulation Component */}
            <Motion.SlideIn
              direction="left"
              className="flex-1 w-full flex justify-center xl:justify-start"
            >
              <div className="relative">
                <div className="absolute -top-10 -right-10 size-32 bg-amber-500/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-10 -left-10 size-32 bg-orange-500/20 rounded-full blur-3xl opacity-50" />
                <MockAiSolver />
              </div>
            </Motion.SlideIn>
          </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="py-24 container mx-auto px-6">
        <Motion.FadeIn>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold flex items-center gap-2">
                  지금 뜨는 문제집{" "}
                  <span className="text-primary animate-pulse">🔥</span>
                </h3>
                <p className="text-muted-foreground">
                  다른 사용자들이 만든 문제집을 풀어보세요. 다양한 주제의 퀴즈가
                  기다리고 있어요.
                </p>
              </div>
              <Link
                href="/workbooks"
                className="text-sm text-muted-foreground hover:text-primary transition-colors shrink-0"
              >
                더보기 &rarr;
              </Link>
            </div>
            <WorkbookCarousel workBooks={workBooks} />
          </div>
        </Motion.FadeIn>
      </section>

      {/* Grid Features */}
      <section className="py-24 container mx-auto px-6 border-t">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <Motion.FadeIn>
            <h3 className="text-3xl md:text-4xl font-bold">
              만들고, 풀고, 나누는
              <br />
              <span className="text-primary">AI 지식 커뮤니티</span>
            </h3>
          </Motion.FadeIn>
          <Motion.FadeIn delay={0.2}>
            <p className="text-muted-foreground text-lg">
              혼자 공부하지 마세요. Solves에서 전 세계 사용자들과 함께
              <br />
              문제를 만들고, AI와 함께 풀고, 지식을 공유하며 성장하세요.
            </p>
          </Motion.FadeIn>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Motion.ScaleIn delay={0.1}>
            <FeatureCard
              icon={<Bot className="size-8 text-primary" />}
              title="AI 문제 생성"
              description="대화하듯 주제를 말하면 AI가 맞춤형 문제를 자동으로 생성합니다."
              color="primary"
            />
          </Motion.ScaleIn>
          <Motion.ScaleIn delay={0.2}>
            <FeatureCard
              icon={<MessageCircleQuestion className="size-8 text-blue-500" />}
              title="스마트 질문"
              description="AI가 조건을 물어보며 정확히 원하는 문제를 만들어드려요."
              color="blue"
            />
          </Motion.ScaleIn>
          <Motion.ScaleIn delay={0.3}>
            <FeatureCard
              icon={<BrainIcon className="size-8 text-amber-500" />}
              title="AI 풀이 도우미"
              description="AI의 사고과정을 보며 문제 풀이의 핵심을 파악하세요."
              color="amber"
            />
          </Motion.ScaleIn>
          <Motion.ScaleIn delay={0.4}>
            <FeatureCard
              icon={<Users className="size-8 text-green-500" />}
              title="지식 공유"
              description="만든 문제집을 공유하고 다른 사람의 문제집으로 학습하세요."
              color="green"
            />
          </Motion.ScaleIn>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <PolicyFooter />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color = "primary",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: "primary" | "blue" | "amber" | "green";
}) {
  const colorClasses = {
    primary: "group-hover:border-primary/30 group-hover:bg-primary/5",
    blue: "group-hover:border-blue-500/30 group-hover:bg-blue-500/5",
    amber: "group-hover:border-amber-500/30 group-hover:bg-amber-500/5",
    green: "group-hover:border-green-500/30 group-hover:bg-green-500/5",
  };

  return (
    <Card
      className={`h-full border bg-card hover:shadow-lg transition-all duration-300 group cursor-default ${colorClasses[color]}`}
    >
      <CardHeader className="pb-2">
        <div className="mb-3 p-2.5 w-fit rounded-xl bg-muted/50 group-hover:scale-110 transition-transform duration-300 ease-out">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
