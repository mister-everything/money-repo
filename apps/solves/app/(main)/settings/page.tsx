"use client";

import { NICKNAME_RULES } from "@service/auth/shared";
import {
  AlertTriangleIcon,
  CheckIcon,
  Loader2Icon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/client";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const [nickname, setNickname] = useState("");
  const [originalNickname, setOriginalNickname] = useState("");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // 닉네임 로드
  useEffect(() => {
    if (session?.user) {
      const userNickname =
        (session.user as any).nickname ?? session.user.name ?? "";
      setNickname(userNickname);
      setOriginalNickname(userNickname);
    }
  }, [session]);

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

  // 닉네임 저장
  const handleSaveNickname = useCallback(async () => {
    const error = validateNickname(nickname);
    if (error) {
      setNicknameError(error);
      return;
    }

    setIsSavingNickname(true);
    try {
      const response = await fetch("/api/user/nickname", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });

      const data = await response.json();
      if (data.ok) {
        toast.success("닉네임이 변경되었습니다.");
        setOriginalNickname(nickname);
        setIsEditingNickname(false);
        router.refresh();
      } else {
        toast.error(data.message || "닉네임 변경에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsSavingNickname(false);
    }
  }, [nickname, validateNickname, router]);

  // 닉네임 편집 취소
  const handleCancelEdit = useCallback(() => {
    setNickname(originalNickname);
    setNicknameError(null);
    setIsEditingNickname(false);
  }, [originalNickname]);

  // 계정 삭제
  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== "계정삭제") {
      toast.error("확인 문구를 정확히 입력해주세요.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.ok) {
        toast.success("계정이 삭제되었습니다. 이용해 주셔서 감사합니다.");
        // 로그아웃 처리
        await authClient.signOut();
        router.push("/");
      } else {
        toast.error(data.message || "계정 삭제에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmText, router]);

  if (isSessionPending) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-12 px-4">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">계정 설정</h1>
        <p className="text-muted-foreground">
          프로필과 계정 정보를 관리합니다.
        </p>
      </div>

      <div className="space-y-6">
        {/* 프로필 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">프로필</CardTitle>
            <CardDescription>
              다른 사용자에게 표시되는 정보입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 프로필 이미지 */}
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border">
                <AvatarImage
                  src={session.user.image ?? ""}
                  alt={session.user.name}
                />
                <AvatarFallback>
                  <UserIcon className="size-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{session.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {session.user.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  프로필 이미지는 연결된 소셜 계정에서 가져옵니다.
                </p>
              </div>
            </div>

            <Separator />

            {/* 닉네임 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">닉네임</Label>
              <p className="text-xs text-muted-foreground">
                문제집을 공유할 때 작성자 이름으로 표시됩니다.
              </p>
              {isEditingNickname ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={nickname}
                      onChange={handleNicknameChange}
                      maxLength={NICKNAME_RULES.maxLength}
                      className={nicknameError ? "border-destructive" : ""}
                      placeholder="닉네임을 입력하세요"
                    />
                    <Button
                      size="icon"
                      onClick={handleSaveNickname}
                      disabled={!!nicknameError || isSavingNickname}
                    >
                      {isSavingNickname ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <CheckIcon className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSavingNickname}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                  {nicknameError && (
                    <p className="text-xs text-destructive">{nicknameError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {nickname.length}/{NICKNAME_RULES.maxLength}자
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted/50 rounded-md">
                    <span>{nickname || "닉네임 없음"}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setIsEditingNickname(true)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 계정 관리 섹션 */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangleIcon className="size-5" />
              위험 구역
            </CardTitle>
            <CardDescription>
              되돌릴 수 없는 작업입니다. 신중하게 결정해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">계정 삭제</p>
                <p className="text-sm text-muted-foreground">
                  계정과 개인정보가 영구적으로 삭제됩니다.
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <TrashIcon className="size-4 mr-2" />
                    계정 삭제
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangleIcon className="size-5 text-destructive" />
                      정말 계정을 삭제하시겠습니까?
                    </DialogTitle>
                    <DialogDescription className="space-y-3 pt-4">
                      <p>
                        계정을 삭제하면 다음 정보가 익명화 처리됩니다:
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>이름과 이메일이 익명화됩니다.</li>
                        <li>프로필 이미지가 삭제됩니다.</li>
                        <li>닉네임이 &quot;탈퇴한 사용자&quot;로 변경됩니다.</li>
                        <li>작성한 문제집은 유지되지만 작성자 정보가 익명화됩니다.</li>
                      </ul>
                      <p className="font-medium pt-2">
                        이 작업은 되돌릴 수 없습니다.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    <Label htmlFor="confirm-delete">
                      확인을 위해 <strong>계정삭제</strong>를 입력해주세요.
                    </Label>
                    <Input
                      id="confirm-delete"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="계정삭제"
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">취소</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== "계정삭제" || isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2Icon className="size-4 animate-spin mr-2" />
                          삭제 중...
                        </>
                      ) : (
                        "계정 영구 삭제"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

