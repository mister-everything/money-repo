"use client";
import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
  getBlockDisplayName,
} from "@service/solves/shared";
import { equal, exclude, StateUpdate } from "@workspace/util";
import { CheckIcon, PencilIcon, TrashIcon, XIcon } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { WorkBookComponentMode } from "../types";
import {
  DefaultBlockContent,
  McqMultipleBlockContent,
  McqSingleBlockContent,
  OXBlockContent,
} from "./block-content";
import { BlockQuestion } from "./block-question";

export type BlockProps<T extends BlockType = BlockType> = {
  id: string;
  question: string;
  order: number;
  type: T;
  errorFeedback?: string;
  isCorrect?: boolean;

  mode: WorkBookComponentMode;
  onToggleEditMode?: () => void;

  content: BlockContent<T>;
  answer?: BlockAnswer<T>;
  submit?: BlockAnswerSubmit<T>;

  onUpdateContent?: (content: StateUpdate<BlockContent<T>>) => void;
  onUpdateAnswer?: (answer: StateUpdate<BlockAnswer<T>>) => void;
  onUpdateQuestion?: (question: string) => void;
  onUpdateSubmitAnswer?: (submit: StateUpdate<BlockAnswerSubmit<T>>) => void;
  onDeleteBlock?: () => void;

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
        <div className="flex items-center gap-2">
          <Badge
            variant={
              props.mode !== "review"
                ? "secondary"
                : props.isCorrect
                  ? "default"
                  : "destructive"
            }
          >
            {getBlockDisplayName(props.type)}
          </Badge>

          <div className="flex-1" />
          {props.mode === "preview" && props.onToggleEditMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={props.onToggleEditMode}
                  variant="ghost"
                  size="icon"
                >
                  <PencilIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>문제 수정하기</span>
              </TooltipContent>
            </Tooltip>
          )}
          {props.mode === "preview" && props.onDeleteBlock && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={props.onDeleteBlock}
                  variant="ghost"
                  size="icon"
                >
                  <TrashIcon className="hover:text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>문제 삭제하기</span>
              </TooltipContent>
            </Tooltip>
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
        ) : blockPropsTypeGuard("mcq-multiple", props) ? (
          <McqMultipleBlockContent
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
          <McqSingleBlockContent
            content={props.content}
            isCorrect={props.isCorrect}
            answer={props.answer}
            submit={props.submit}
            mode={props.mode}
            onUpdateContent={props.onUpdateContent}
            onUpdateSubmitAnswer={props.onUpdateSubmitAnswer}
            onUpdateAnswer={props.onUpdateAnswer}
          />
        ) : blockPropsTypeGuard("ox", props) ? (
          <OXBlockContent
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
    "onDeleteBlock",
  ]);
  const nextProps = exclude(next, [
    "onToggleEditMode",
    "onUpdateContent",
    "onUpdateAnswer",
    "onUpdateQuestion",
    "onDeleteBlock",
  ]);
  if (!equal(prevProps, nextProps)) return false;
  return true;
});
