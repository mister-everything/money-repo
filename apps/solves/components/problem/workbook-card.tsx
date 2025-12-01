import {
  WorkBookCompleted,
  WorkBookInProgress,
  WorkBookWithoutBlocks,
} from "@service/solves/shared";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InDevelopment } from "../ui/in-development";

type WorkBookCardType =
  | WorkBookWithoutBlocks
  | WorkBookInProgress
  | WorkBookCompleted;

interface WorkbookCardProps {
  book: WorkBookCardType;
}

/** endTime이 있으면 풀이 완료 */
function isWorkBookCompleted(
  book: WorkBookCardType,
): book is WorkBookCompleted {
  return "endTime" in book && book.endTime !== null;
}

/** startTime만 있고 endTime이 없으면 풀이 중 */
function isWorkBookInProgress(
  book: WorkBookCardType,
): book is WorkBookInProgress {
  return "startTime" in book && !("endTime" in book && book.endTime !== null);
}

export function WorkbookCard({ book }: WorkbookCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2 text-xl font-bold">
            {book.title}
          </CardTitle>
        </div>
        {book.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {book.description}
          </p>
        )}
        <InDevelopment className="w-full text-sm h-6">
          Description
        </InDevelopment>
        {isWorkBookCompleted(book) && (
          <Badge
            variant="outline"
            className="w-fit bg-green-50 text-green-700 border-green-200"
          >
            풀이 완료 {book.correctAnswerCount}/{book.totalProblems}
          </Badge>
        )}
        {isWorkBookInProgress(book) && (
          <Badge
            variant="outline"
            className="w-fit bg-blue-50 text-blue-500 border-none"
          >
            풀이 중
          </Badge>
        )}
        {!isWorkBookCompleted(book) && !isWorkBookInProgress(book) && (
          <Badge
            variant="outline"
            className="w-fit bg-gray-50 text-gray-700 border-gray-200"
          >
            풀지 않음
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2 mb-4">
          {book.tags?.slice(0, 8).map((tag) => (
            <span
              key={tag.id}
              className="bg-secondary text-secondary-foreground text-xs px-2 py-1.5 rounded-md font-medium"
            >
              # {tag.name}
            </span>
          ))}
          {book.tags && book.tags.length > 4 && (
            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1.5 rounded-md font-medium">
              +{book.tags.length - 4}
            </span>
          )}
          <InDevelopment className="w-full text-sm h-10">Tags</InDevelopment>
        </div>
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-xs text-muted-foreground shrink-0">
            발행 일자: {format(new Date(book.publishedAt!), "yyyy.MM.dd")}
          </span>
          <div className="text-xs text-muted-foreground mt-auto ml-auto">
            @{book.ownerName}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
