"use client";

import { ProbBook, ProbBookInProgress } from "@service/solves/shared";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkbookCardProps {
  book: ProbBook | ProbBookInProgress;
}

export function WorkbookCard({ book }: WorkbookCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="line-clamp-2 text-xl font-bold">
            {book.title}
          </CardTitle>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">
            발행 일자: {format(new Date(book.createdAt), "yyyy.MM.dd")}
          </span>
        </div>
        {book.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {book.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="flex flex-wrap gap-2 mb-4">
          {book.tags?.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-md font-medium"
            >
              # {tag}
            </span>
          ))}
          {book.tags && book.tags.length > 4 && (
            <span className="bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-md font-medium">
              +{book.tags.length - 4}
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-auto">
          {book.owner.name}
        </div>
      </CardContent>
    </Card>
  );
}
