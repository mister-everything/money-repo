import { workBookService } from "@service/solves";
import Link from "next/link";
import { WorkbookCard } from "@/components/problem/workbook-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth/server";

export default async function CompletedWorkbooksPage() {
  const session = await getSession();
  const completedWorkbooks = await workBookService.getCompletedWorkBooks(
    session.user.id,
  );
  return (
    <div className="h-screen">
      {/* 헤더 */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-foreground">내가 푼 문제집</h1>
          <p className="text-muted-foreground mt-2">
            다 푼 문제집을 확인해보세요.
          </p>
        </div>
      </div>
      {/* 문제집 목록 */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedWorkbooks.length > 0 ? (
            completedWorkbooks.map((book) => (
              <Link href={`/workbooks/${book.id}/result`} key={book.id}>
                <WorkbookCard book={book} />
              </Link>
            ))
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-muted-foreground text-6xl mb-4">📚</div>
                <CardTitle className="mb-2">아직 문제집이 없습니다</CardTitle>
                <CardDescription>
                  첫 번째 문제집을 만들어보세요!
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
