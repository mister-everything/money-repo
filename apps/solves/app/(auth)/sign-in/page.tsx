"use client";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Suspense, useCallback } from "react";
import { toast } from "sonner";
import { PolicyFooter } from "@/components/layouts/policy-footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleIcon, KakaoIcon, NaverIcon } from "@/components/ui/custom-icon";
import FaultyTerminal from "@/components/ui/faulty-terminal";
import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { authClient } from "@/lib/auth/client";
import { logger } from "@/lib/logger";

const oauthProviders: {
  name: string;
  provider: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}[] = [
  {
    name: "Google",
    provider: "google",
    icon: GoogleIcon,
  },
  {
    name: "Naver",
    provider: "naver",
    icon: NaverIcon,
    disabled: true,
  },
  {
    name: "Kakao",
    provider: "kakao",
    icon: KakaoIcon,
    disabled: true,
  },
];

function SignInContent() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSocialSignIn = useCallback(
    (provider: string) => {
      authClient.signIn
        .social({ provider, callbackURL: callbackUrl })
        .catch((e: any) => {
          logger.info(`authClient.signIn.social error ${provider}`, e);
          toast.warning(`${provider} 로그인에 실패했습니다.`);
        })
        .finally(() => {
          logger.info(`end sign in with ${provider}`);
        });
    },
    [callbackUrl],
  );

  return (
    <div className="w-full h-full relative">
      <div className="fixed inset-0 -z-10 w-full h-screen opacity-40">
        <FaultyTerminal
          tint={resolvedTheme === "dark" ? "#e1ffc7" : "#030408"}
          mouseReact={false}
          brightness={resolvedTheme === "dark" ? 0.6 : 4}
        />
      </div>
      <Card className="shadow-none flex flex-col gap-4 justify-center w-full max-w-xl  h-full mx-auto bg-transparent border-none fade-1000">
        <CardHeader className="space-y-2 flex flex-col items-center justify-center text-center ">
          <CardTitle className="fade-3000 text-5xl tracking-tight font-black bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/50">
            호기심이 문제가 되는 순간
          </CardTitle>
          <CardDescription>
            <GradualSpacingText text="AI와 함께 문제집을 만들고, 풀고, 공유하며" />
            <br />
            <GradualSpacingText
              text="새로운 학습을 경험해보세요."
              delayMultiple={0.06}
            />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 my-12 lg:max-w-sm w-full mx-auto">
          {oauthProviders.map((provider) => (
            <Button
              key={provider.name}
              variant="outline"
              className="w-full py-6 rounded-full justify-start hover:bg-primary! hover:text-primary-foreground!"
              onClick={() => handleSocialSignIn(provider.provider)}
              disabled={provider.disabled}
            >
              <div className="px-4">
                <provider.icon className="size-4" />
              </div>
              {provider.name}로 계속하기
            </Button>
          ))}
        </CardContent>
        <CardFooter className="flex items-center justify-center gap-2 text-sm">
          <PolicyFooter />
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
