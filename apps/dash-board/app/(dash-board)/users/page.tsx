import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Search, ShieldCheck, ShieldX } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUsers } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function UsersPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const search = (searchParams.search as string) || "";

  const { users, totalCount, totalPages } = await getUsers(page, search);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">사용자 관리</h1>
          <p className="text-muted-foreground mt-2">
            전체 사용자를 조회하고 관리할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            사용자 검색
          </CardTitle>
          <CardDescription>이름 또는 이메일로 검색하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/users" method="get">
            <div className="flex gap-2">
              <Input
                name="search"
                placeholder="이름 또는 이메일 입력..."
                defaultValue={search}
                className="flex-1"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                검색
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록 ({totalCount.toLocaleString()}명)</CardTitle>
          <CardDescription>
            사용자를 클릭하면 상세 정보를 확인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              사용자가 없습니다.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>가입일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <Link
                          href={`/users/${user.id}`}
                          className="block w-full"
                        >
                          <div className="flex items-center gap-2">
                            {user.image && (
                              <img
                                src={user.image}
                                alt={user.name}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/users/${user.id}`}
                          className="block w-full"
                        >
                          <div className="flex items-center gap-2">
                            <span>{user.email}</span>
                            {user.emailVerified && (
                              <ShieldCheck className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/users/${user.id}`}
                          className="block w-full"
                        >
                          <RoleBadge role={user.role} />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/users/${user.id}`}
                          className="block w-full"
                        >
                          <StatusBadge
                            banned={user.banned}
                            banExpires={user.banExpires}
                          />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/users/${user.id}`}
                          className="block w-full"
                        >
                          {formatDistanceToNow(new Date(user.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {page > 1 && (
                        <PaginationItem>
                          <PaginationPrevious
                            href={`/users?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                          />
                        </PaginationItem>
                      )}

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            (p >= page - 2 && p <= page + 2),
                        )
                        .map((p, idx, arr) => {
                          // Add ellipsis
                          if (idx > 0 && p - arr[idx - 1] > 1) {
                            return (
                              <>
                                <PaginationItem key={`ellipsis-${p}`}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem key={p}>
                                  <PaginationLink
                                    href={`/users?page=${p}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                                    isActive={p === page}
                                  >
                                    {p}
                                  </PaginationLink>
                                </PaginationItem>
                              </>
                            );
                          }

                          return (
                            <PaginationItem key={p}>
                              <PaginationLink
                                href={`/users?page=${p}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                                isActive={p === page}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                      {page < totalPages && (
                        <PaginationItem>
                          <PaginationNext
                            href={`/users?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  if (role === "admin") {
    return (
      <Badge className="bg-purple-500">
        <ShieldCheck className="mr-1 h-3 w-3" />
        관리자
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <ShieldX className="mr-1 h-3 w-3" />
      사용자
    </Badge>
  );
}

function StatusBadge({
  banned,
  banExpires,
}: {
  banned: boolean | null;
  banExpires: string | null;
}) {
  if (banned) {
    if (banExpires && new Date(banExpires) < new Date()) {
      return <Badge variant="outline">밴 만료</Badge>;
    }
    return <Badge variant="destructive">밴됨</Badge>;
  }
  return <Badge className="bg-green-500">활성</Badge>;
}
