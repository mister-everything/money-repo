import { WorkBookWithoutAnswer } from "@service/solves/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export const ProblemHeader = ({
  workBook,
}: {
  workBook: WorkBookWithoutAnswer;
}) => {
  return (
    <Card className="mb-8 text-primary border-none">
      <CardHeader>
        <CardTitle className="text-3xl text-foreground">
          {workBook.title}
        </CardTitle>
        {workBook.description && (
          <CardDescription className="text-foreground">
            {workBook.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 text-sm text-foreground">
            <span>총 {workBook.blocks.length}문제</span>
          </div>

          {workBook.tags && workBook.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {workBook.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm "
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
