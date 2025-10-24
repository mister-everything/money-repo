"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { setInviteTokenCookie } from "./actions";

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

interface SignInFormProps {
  inviteToken?: string;
}

export default function SignInForm({ inviteToken }: SignInFormProps) {
  const [isSettingCookie, setIsSettingCookie] = useState(false);
  const isInvite = !!inviteToken;

  // Set cookie on mount if there's an invite token
  useEffect(() => {
    if (inviteToken && !isSettingCookie) {
      setIsSettingCookie(true);
      setInviteTokenCookie(inviteToken)
        .then((result) => {
          if (!result.success) {
            toast.error("유효하지 않거나 만료된 초대 링크입니다.");
          }
        })
        .catch((error) => {
          console.error("Failed to set invite token:", error);
          toast.error("초대 토큰 처리에 실패했습니다.");
        });
    }
  }, [inviteToken, isSettingCookie]);

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
    <Card className="shadow-none flex flex-col gap-4 justify-center w-full max-w-sm h-full mx-auto bg-transparent border-none">
      <CardHeader className="space-y-2 flex flex-col items-center justify-center">
        {isInvite && (
          <Badge className="mb-2 bg-primary text-primary-foreground">
            Admin 초대
          </Badge>
        )}
        <CardTitle className="text-3xl">
          {isInvite ? "관리자로 초대되셨습니다" : "스마트한 응답을 경험하세요."}
        </CardTitle>
        <CardDescription className="text-center">
          {isInvite ? (
            <>
              초대 링크를 통해 관리자 계정으로 가입합니다.
              <br />
              아래 소셜 로그인을 통해 계속 진행하세요.
            </>
          ) : (
            "더 스마트한 응답, 파일 및 이미지 업로드 등을 이용할 수 있습니다."
          )}
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
