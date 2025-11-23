"use client";
import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
  getBlockDisplayName,
} from "@service/solves/shared";
import { equal, exclude, StateUpdate } from "@workspace/util";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { memo, Ref } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { InDevelopment } from "@/components/ui/in-development";
import { cn } from "@/lib/utils";
import { DefaultBlockContent, McqBlockContent } from "./block-content";
import { BlockQuestion } from "./block-question";
import { BlockComponentMode } from "./types";

export type BlockProps<T extends BlockType = BlockType> = {
  id: string;
  question: string;
  order: number;
  type: T;
  errorFeedback?: string;
  isCorrect?: boolean;

  mode: BlockComponentMode;
  onToggleEditMode?: () => void;

  content: BlockContent<T>;
  answer?: BlockAnswer<T>;
  submit?: BlockAnswerSubmit<T>;

  onUpdateContent?: (content: StateUpdate<BlockContent<T>>) => void;
  onUpdateAnswer?: (answer: StateUpdate<BlockAnswer<T>>) => void;
  onUpdateQuestion?: (question: string) => void;
  onUpdateSubmitAnswer?: (submit: StateUpdate<BlockAnswerSubmit<T>>) => void;

  className?: string;
  ref?: Ref<HTMLDivElement>;
};

const blockPropsTypeGuard = <T extends BlockType = BlockType>(
  type: T,
  props: BlockProps<any>,
): props is BlockProps<T> => {
  return props.type === type;
};

function PureBlock<T extends BlockType = BlockType>({
  className,
  ref,
  ...props
}: BlockProps<T>) {
  return (
    <Card className={cn("gap-2", className)} ref={ref}>
      <CardHeader>
        <div className="flex items-center gap-2 justify-between">
          <Badge
            variant={
              props.mode !== "review"
                ? "secondary"
                : props.isCorrect
                  ? "default"
                  : "destructive"
            }
          >
            {getBlockDisplayName(props.type)} {props.order}
          </Badge>

          {props.mode === "preview" && (
            <Button
              onClick={props.onToggleEditMode}
              variant="ghost"
              size="icon"
            >
              <PencilIcon />
            </Button>
          )}
          {props.mode === "edit" && (
            <Button
              onClick={props.onToggleEditMode}
              variant="secondary"
              size="icon"
            >
              <CheckIcon />
            </Button>
          )}

          {props.mode === "review" &&
            (props.isCorrect ? (
              <CheckIcon className="text-primary" />
            ) : (
              <XIcon className="text-destructive" />
            ))}
        </div>
        <BlockQuestion
          question={props.question}
          mode={props.mode}
          onChangeQuestion={props.onUpdateQuestion}
        />
      </CardHeader>
      <CardContent>
        {blockPropsTypeGuard("default", props) ? (
          <DefaultBlockContent
            content={props.content}
            isCorrect={props.isCorrect}
            answer={props.answer}
            submit={props.submit}
            mode={props.mode}
            onUpdateContent={props.onUpdateContent}
            onUpdateSubmitAnswer={props.onUpdateSubmitAnswer}
            onUpdateAnswer={props.onUpdateAnswer}
          />
        ) : blockPropsTypeGuard("mcq", props) ? (
          <McqBlockContent
            content={props.content}
            isCorrect={props.isCorrect}
            answer={props.answer}
            submit={props.submit}
            mode={props.mode}
            onUpdateContent={props.onUpdateContent}
            onUpdateSubmitAnswer={props.onUpdateSubmitAnswer}
            onUpdateAnswer={props.onUpdateAnswer}
          />
        ) : (
          <InDevelopment className="w-full text-sm h-48">
            아직 지원하지 않는 블럭 입니다.
          </InDevelopment>
        )}
      </CardContent>
      <CardFooter>
        {props.errorFeedback && (
          <p className="text-destructive text-sm">{props.errorFeedback}</p>
        )}
      </CardFooter>
    </Card>
  );
}

PureBlock.displayName = "PureBlock";

export const Block = memo(PureBlock, (prev, next) => {
  const prevProps = exclude(prev, [
    "onToggleEditMode",
    "onUpdateContent",
    "onUpdateAnswer",
    "onUpdateQuestion",
  ]);
  const nextProps = exclude(next, [
    "onToggleEditMode",
    "onUpdateContent",
    "onUpdateAnswer",
    "onUpdateQuestion",
  ]);
  if (!equal(prevProps, nextProps)) return false;
  return true;
});
