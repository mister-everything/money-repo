import {
  SessionInProgress,
  SessionSubmitted,
  WorkBookWithoutBlocks,
} from "@service/solves/shared";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkbookCardProps {
  workBook: WorkBookWithoutBlocks;
  session?: SessionInProgress | SessionSubmitted;
}

export function WorkbookCard({ workBook, session }: WorkbookCardProps) {
  return (
    <Card className="hover:bg-secondary cursor-pointer hover:shadow-sm transition-shadow shadow-none rounded-sm h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2 text-xl font-bold truncate">
            {workBook.title || "제목이 없습니다."}
          </CardTitle>
        </div>

        <p className="text-muted-foreground line-clamp-2 text-sm">
          {workBook.description || "설명이 없습니다."}
        </p>

        {session?.status === "submitted" ? (
          <Badge
            variant="outline"
            className="w-fit bg-green-50 text-green-700 border-green-200"
          >
            풀이 완료 {session.correctBlocks}/{session.totalBlocks}
          </Badge>
        ) : session?.status === "in-progress" ? (
          <Badge
            variant="outline"
            className="w-fit bg-blue-50 text-blue-500 border-none"
          >
            풀이 중
          </Badge>
        ) : (
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
          {workBook.tags?.slice(0, 8).map((tag) => (
            <span
              key={tag.id}
              className="bg-secondary text-secondary-foreground text-xs px-2 py-1.5 rounded-md font-medium"
            >
              # {tag.name}
            </span>
          ))}
          {workBook.tags && workBook.tags.length > 4 && (
            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1.5 rounded-md font-medium">
              +{workBook.tags.length - 4}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-auto">
          {workBook.publishedAt && (
            <span className="text-xs text-muted-foreground shrink-0">
              발행 일자: {format(new Date(workBook.publishedAt!), "yyyy.MM.dd")}
            </span>
          )}
          <div className="text-xs text-muted-foreground mt-auto ml-auto">
            @{workBook.ownerName}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
