import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getUserDetail } from "./actions";
import { BanUserForm } from "./ban-user-form";
import { RoleUpdateForm } from "./role-update-form";
import { UnbanUserButton } from "./unban-user-button";
import { WalletChargeButton } from "./wallet-charge-button";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function UserDetailPage(props: { params: Params }) {
  const params = await props.params;
  const user = await getUserDetail(params.id);

  if (!user) {
    notFound();
  }

  const balanceValue = user.balance ?? null;
  const balanceError =
    balanceValue === null ? "잔액을 불러오지 못했습니다." : null;

  const isBanned = user.banned;
  const isBanActive =
    isBanned && (!user.banExpires || new Date(user.banExpires) > new Date());

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">사용자 상세 정보</h1>
          <p className="text-muted-foreground mt-2">
            사용자 정보를 확인하고 관리할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Image & Name */}
            <div className="flex items-center gap-4">
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <p className="text-2xl font-semibold">{user.name}</p>
                {user.isAnonymous && (
                  <Badge variant="secondary" className="mt-1">
                    익명 사용자
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">이메일</p>
                <p className="font-medium">{user.email}</p>
              </div>
              {user.emailVerified ? (
                <Badge className="bg-green-500">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  인증됨
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <ShieldAlert className="mr-1 h-3 w-3" />
                  미인증
                </Badge>
              )}
            </div>

            <Separator />

            {/* Role */}
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">역할</p>
                <p className="font-medium">
                  {user.role === "admin" ? "관리자" : "사용자"}
                </p>
              </div>
              <Badge
                className={
                  user.role === "admin" ? "bg-purple-500" : "bg-gray-500"
                }
              >
                {user.role === "admin" ? "ADMIN" : "USER"}
              </Badge>
            </div>

            <Separator />

            {/* Created At */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">가입일</p>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  <span className="text-sm text-muted-foreground ml-2">
                    (
                    {formatDistanceToNow(new Date(user.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                    )
                  </span>
                </p>
              </div>
            </div>

            {/* User ID */}
            <div>
              <p className="text-sm text-muted-foreground">사용자 ID</p>
              <p className="font-mono text-xs text-muted-foreground">
                {user.id}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              역할 관리
            </CardTitle>
            <CardDescription>
              사용자의 권한을 변경할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RoleUpdateForm
              userId={user.id}
              currentRole={user.role || "user"}
            />
          </CardContent>

          <div className="px-6">
            <Separator />
          </div>

          {/* 지갑 현황 및 충전  */}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              지갑 잔액
            </CardTitle>
            <CardDescription>사용자의 현재 크레딧 잔액입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="text-xl font-bold">
              {balanceValue !== null
                ? `${balanceValue.toLocaleString("ko-KR")} Credit`
                : "크레딧을 불러오지 못했습니다."}
            </div>
            {balanceError && (
              <p className="text-sm text-destructive">{balanceError}</p>
            )}
            <WalletChargeButton
              userId={user.id}
              currentBalance={balanceValue}
            />
          </CardContent>
        </Card>

        {/* Ban Status Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              계정 상태 관리
            </CardTitle>
            <CardDescription>
              사용자를 밴하거나 밴을 해제할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Ban Status */}
            {isBanned && (
              <div className="p-4 border rounded-lg bg-destructive/10">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        {isBanActive ? "밴됨" : "밴 만료"}
                      </Badge>
                      <p className="font-semibold">
                        이 사용자는 현재 밴 상태입니다.
                      </p>
                    </div>
                    {user.banReason && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          밴 사유:
                        </p>
                        <p className="text-sm">{user.banReason}</p>
                      </div>
                    )}
                    {user.banExpires && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          밴 만료일:
                        </p>
                        <p className="text-sm">
                          {new Date(user.banExpires).toLocaleDateString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                          {new Date(user.banExpires) > new Date() && (
                            <span className="text-muted-foreground ml-2">
                              (
                              {formatDistanceToNow(new Date(user.banExpires), {
                                addSuffix: true,
                                locale: ko,
                              })}
                              )
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  <UnbanUserButton userId={user.id} />
                </div>
              </div>
            )}

            {/* Ban User Form */}
            {!isBanActive && <BanUserForm userId={user.id} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
