"use client";
import Link from "next/link";
import { useCallback } from "react";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/client";

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
    name: "Kakao",
    provider: "kakao",
    icon: KakaoIcon,
    disabled: true,
  },

  {
    name: "Naver",
    provider: "naver",
    icon: NaverIcon,
    disabled: true,
  },
];

export default function SignUpPage() {
  const handleSocialSignIn = useCallback((provider: string) => {
    console.log(`start sign in with ${provider}`);
    authClient.signIn
      .social({ provider })
      .catch((e: any) => {
        console.log(`authClient.signIn.social error ${provider}`, e);
        toast.warning(`${provider} 로그인에 실패했습니다.`);
      })
      .finally(() => {
        console.log(`end sign in with ${provider}`);
      });
  }, []);

  return (
    <Card className="shadow-none flex flex-col gap-4 justify-center w-full max-w-sm  h-full mx-auto bg-transparent border-none">
      <CardHeader className="space-y-2 flex flex-col items-center justify-center">
        <CardTitle className="text-3xl">스마트한 응답을 경험하세요.</CardTitle>
        <CardDescription>
          더 스마트한 응답, 파일 및 이미지 업로드 등을 이용할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 my-8">
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
        <Link className="hover:underline" href="/terms">
          이용약관
        </Link>
        <Separator className="h-2 w-4" orientation="vertical" />
        <Link className="hover:underline" href="/privacy">
          개인정보 보호 정책
        </Link>
      </CardFooter>
    </Card>
  );
}
