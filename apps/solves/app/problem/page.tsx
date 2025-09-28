"use client";

import { useState } from "react";
import { ProblemBook } from "@/components/problem/problem-book";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mockProbBook, mockProbBooks } from "@/lib/problem/mock-data";

export default function ProblemBookPage() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [currentBook, setCurrentBook] = useState(mockProbBook);

  const selectBook = (bookId: string) => {
    const book = mockProbBooks.find((b) => b.id === bookId);
    if (book) {
      setCurrentBook(book);
      setSelectedBookId(bookId);
    }
  };

  const goBackToList = () => {
    setSelectedBookId(null);
  };

  if (selectedBookId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="max-w-4xl mx-auto p-6">
            <Button
              variant="ghost"
              onClick={goBackToList}
              className="text-primary hover:text-primary/90"
            >
              ← 문제집 목록으로 돌아가기
            </Button>
          </div>
        </div>
        <ProblemBook probBook={currentBook} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* 헤더 */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-foreground">
            문제집 라이브러리
          </h1>
          <p className="text-muted-foreground mt-2">
            다양한 문제집을 선택해서 풀어보세요.
          </p>
        </div>
      </div>

      {/* 문제집 목록 */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProbBooks.map((book) => (
            <Card
              key={book.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => selectBook(book.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-2 text-lg">
                    {book.title}
                  </CardTitle>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full shrink-0 ml-2">
                    {book.blocks.length}문제
                  </span>
                </div>
                {book.description && (
                  <CardDescription className="line-clamp-3">
                    {book.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.tags?.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                  {book.tags && book.tags.length > 3 && (
                    <span className="text-muted-foreground text-xs">
                      +{book.tags.length - 3}개
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    생성일: {book.createdAt.toLocaleDateString("ko-KR")}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/90 p-0"
                  >
                    문제 풀기 →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 빈 상태 */}
        {mockProbBooks.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground text-6xl mb-4">📚</div>
              <CardTitle className="mb-2">아직 문제집이 없습니다</CardTitle>
              <CardDescription>첫 번째 문제집을 만들어보세요!</CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 푸터 */}
      <footer className="border-t bg-card mt-12">
        <div className="max-w-6xl mx-auto p-6 text-center text-muted-foreground text-sm">
          문제집 시스템 데모 - TypeScript + Next.js
        </div>
      </footer>
    </div>
  );
}
