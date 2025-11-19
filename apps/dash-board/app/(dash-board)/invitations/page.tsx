"use client";

import { Invitation } from "@service/auth/shared";
import { errorToString } from "@workspace/util";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Link as LinkIcon, Plus } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { createInviteTokenAction, getInvitations } from "./actions";

const createLink = (token: string) =>
  `${window.location.origin}/sign-in?invite=${token}`;

export default function InvitationsPage() {
  const {
    data: invitations,
    isLoading,
    mutate,
  } = useSWR("/invitations", getInvitations, {
    onError: (err) => toast.error(errorToString(err)),
    fallbackData: [],
  });

  const [, createInviteToken, isPending] = useSafeAction(
    createInviteTokenAction,
    {
      onSuccess: async (token) => {
        const inviteUrl = createLink(token);
        mutate();
        await navigator.clipboard.writeText(inviteUrl);
        toast.success("초대 링크가 복사되었습니다.");
      },
      onError: (err) => toast.error(errorToString(err)),
    },
  );

  const activeInvitations = useMemo(
    () =>
      invitations.filter(
        (inv) => !inv.usedAt && new Date(inv.expiresAt) > new Date(),
      ),
    [invitations],
  );
  const usedOrExpiredInvitations = useMemo(
    () =>
      invitations.filter(
        (inv) => inv.usedAt || new Date(inv.expiresAt) <= new Date(),
      ),
    [invitations],
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin 초대 관리</h1>
          <p className="text-muted-foreground mt-2">
            새로운 관리자를 초대할 수 있는 링크를 생성하고 관리합니다.
          </p>
        </div>
        <Button onClick={createInviteToken} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          {isPending ? "생성 중..." : "초대 링크 생성"}
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="w-full h-96" />
      ) : (
        <>
          {/* Active Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                활성 초대 링크
              </CardTitle>
              <CardDescription>
                현재 사용 가능한 초대 링크입니다. 각 링크는 한 번만 사용할 수
                있으며, 24시간 후 자동으로 만료됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeInvitations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  활성 초대 링크가 없습니다.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>토큰</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead>만료일</TableHead>
                      <TableHead className="text-right">링크 복사</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeInvitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="text-center">
                          {invitation.token.slice(0, 6)}...
                          {invitation.token.slice(-3)}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge invitation={invitation} />
                        </TableCell>
                        <TableCell className="text-center">
                          {formatDistanceToNow(new Date(invitation.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatDistanceToNow(new Date(invitation.expiresAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <CopyButton text={createLink(invitation.token)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Used/Expired Invitations */}
          {usedOrExpiredInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>사용된 / 만료된 초대</CardTitle>
                <CardDescription>
                  이미 사용되었거나 만료된 초대 링크의 기록입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>상태</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead>만료일</TableHead>
                      <TableHead>사용 정보</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usedOrExpiredInvitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="text-center">
                          <StatusBadge invitation={invitation} />
                        </TableCell>
                        <TableCell className="text-center">
                          {formatDistanceToNow(new Date(invitation.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatDistanceToNow(new Date(invitation.expiresAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </TableCell>
                        <TableCell>
                          {invitation.usedAt && invitation.usedByUser ? (
                            <div className="text-sm">
                              <p className="font-medium">
                                {invitation.usedByUser.name}
                              </p>
                              <p className="text-muted-foreground">
                                {invitation.usedByUser.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(invitation.usedAt),
                                  {
                                    addSuffix: true,
                                    locale: ko,
                                  },
                                )}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ invitation }: { invitation: Invitation }) {
  const now = new Date();
  const expiresAt = new Date(invitation.expiresAt);

  if (invitation.usedAt) {
    return <Badge variant="secondary">사용됨</Badge>;
  }
  if (expiresAt < now) {
    return <Badge variant="destructive">만료됨</Badge>;
  }
  return <Badge className="bg-green-500">활성</Badge>;
}
