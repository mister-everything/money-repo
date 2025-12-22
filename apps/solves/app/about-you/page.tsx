"use client";

import { CURRENT_PRIVACY_VERSION, NICKNAME_RULES } from "@service/auth/shared";
import { CheckIcon, Loader2Icon, RefreshCwIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

export default function AboutYouPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const [nickname, setNickname] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // 닉네임 유효성 검증
  const validateNickname = useCallback((value: string): string | null => {
    if (value.length < NICKNAME_RULES.minLength) {
      return `닉네임은 최소 ${NICKNAME_RULES.minLength}자 이상이어야 합니다.`;
    }
    if (value.length > NICKNAME_RULES.maxLength) {
      return `닉네임은 최대 ${NICKNAME_RULES.maxLength}자까지 가능합니다.`;
    }
    if (!NICKNAME_RULES.pattern.test(value)) {
      return "닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.";
    }
    return null;
  }, []);

  // 랜덤 닉네임 생성
  const generateRandomNickname = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/user/nickname", { method: "POST" });
      const data = await response.json();
      if (data.ok && data.data?.nickname) {
        setNickname(data.data.nickname);
        setNicknameError(null);
      }
    } catch (error) {
      toast.error("닉네임 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 초기 닉네임 생성
  useEffect(() => {
    if (session && !nickname) {
      generateRandomNickname();
    }
  }, [session, nickname, generateRandomNickname]);

  // 이미 온보딩 완료한 경우 홈으로 리다이렉트
  useEffect(() => {
    if (session?.user && (session.user as any).hasPrivacyConsent) {
      router.replace("/");
    }
  }, [session, router]);

  // 닉네임 변경 핸들러
  const handleNicknameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setNickname(value);
      if (value) {
        setNicknameError(validateNickname(value));
      } else {
        setNicknameError(null);
      }
    },
    [validateNickname],
  );

  // 온보딩 완료 제출
  const handleSubmit = useCallback(async () => {
    // 유효성 검증
    const error = validateNickname(nickname);
    if (error) {
      setNicknameError(error);
      return;
    }
    if (!privacyConsent) {
      toast.error("개인정보 처리방침에 동의해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          privacyVersion: CURRENT_PRIVACY_VERSION,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        toast.success("환영합니다! 서비스를 시작하세요.");
        router.push("/");
        router.refresh();
      } else {
        toast.error(data.message || "오류가 발생했습니다.");
      }
    } catch (error) {
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }, [nickname, privacyConsent, validateNickname, router]);

  const isValid = !nicknameError && nickname && privacyConsent;

  if (isSessionPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>
              서비스를 이용하려면 먼저 로그인해주세요.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/sign-in">로그인하기</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-lg shadow-xl border-border/50">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto relative">
            <Avatar className="size-24 border-4 border-primary/20">
              <AvatarImage
                src={session.user.image ?? ""}
                alt={session.user.name}
              />
              <AvatarFallback className="text-2xl bg-primary/10">
                <UserIcon className="size-10 text-primary/60" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5">
              <CheckIcon className="size-4" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              Solves에 오신 것을 환영합니다!
            </CardTitle>
            <CardDescription className="mt-2">
              서비스를 시작하기 전에 몇 가지 정보를 설정해주세요.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* 닉네임 설정 */}
          <div className="space-y-3">
            <Label htmlFor="nickname" className="text-sm font-medium">
              닉네임
            </Label>
            <p className="text-xs text-muted-foreground">
              문제집을 공유할 때 다른 사용자에게 표시되는 이름입니다.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={handleNicknameChange}
                  placeholder="닉네임을 입력하세요"
                  maxLength={NICKNAME_RULES.maxLength}
                  className={nicknameError ? "border-destructive" : ""}
                  disabled={isGenerating}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateRandomNickname}
                disabled={isGenerating}
                title="랜덤 닉네임 생성"
              >
                <RefreshCwIcon
                  className={`size-4 ${isGenerating ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            {nicknameError && (
              <p className="text-xs text-destructive">{nicknameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {nickname.length}/{NICKNAME_RULES.maxLength}자
            </p>
          </div>

          {/* 개인정보 동의 */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy-consent"
                checked={privacyConsent}
                onCheckedChange={(checked) =>
                  setPrivacyConsent(checked === true)
                }
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="privacy-consent"
                  className="text-sm font-medium cursor-pointer leading-relaxed"
                >
                  개인정보 처리방침에 동의합니다{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  서비스 이용을 위해 필수로 동의해야 합니다.{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    전문 보기
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 pt-6">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 text-base font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-5 animate-spin mr-2" />
                처리 중...
              </>
            ) : (
              "시작하기"
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            시작하기를 누르면 개인정보 처리방침에 동의하게 됩니다.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
