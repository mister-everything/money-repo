"use client";
import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
  blockValidate,
  getBlockDisplayName,
} from "@service/solves/shared";
import { equal, exclude, StateUpdate } from "@workspace/util";
import {
  CheckIcon,
  CircleIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { memo, Ref, useMemo } from "react";
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
  RankingBlockContent,
} from "./block-content";
import { BlockQuestion } from "./block-question";
import { BlockSolution } from "./block-solution";

export type BlockProps<T extends BlockType = BlockType> = {
  id: string;
  question: string;
  index: number;
  order: number;
  isPending?: boolean;
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
  onUpdateSolution?: (solution: string) => void;
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
  const blockErrorMessage = useMemo(() => {
    if (props.mode != "edit") return;
    const result = blockValidate({
      question: props.question,
      content: props.content,
      answer: props.answer ?? ({} as BlockAnswer<T>),
      type: props.type,
    });

    if (result.success) return;
    return (
      Object.values(result.errors ?? {})
        .flat()
        .join("\n") || result.message
    );
  }, [props.mode, props.answer, props.content, props.question, props.type]);

  return (
    <Card className={cn("gap-2 shadow-none ", className)} ref={ref}>
      <CardHeader className="px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              props.mode !== "review"
                ? ""
                : props.isCorrect
                  ? "bg-primary"
                  : "bg-destructive",
            )}
            variant="default"
          >
            문제 {props.index + 1}
          </Badge>
          <Badge variant="secondary">{getBlockDisplayName(props.type)}</Badge>

          <div className="flex-1" />
          {props.mode === "preview" && props.onToggleEditMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={props.onToggleEditMode}
                  variant="ghost"
                  className="hover:bg-primary hover:text-primary-foreground"
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
                  className="hover:bg-primary hover:text-primary-foreground"
                  size="icon"
                >
                  <TrashIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>문제 삭제</span>
              </TooltipContent>
            </Tooltip>
          )}

          {props.mode === "edit" && (
            <Tooltip open={blockErrorMessage ? undefined : false}>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={props.onToggleEditMode}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "hover:bg-primary hover:text-primary-foreground",
                      !blockErrorMessage &&
                        "text-primary-foreground bg-primary",
                    )}
                    disabled={Boolean(blockErrorMessage)}
                  >
                    <CheckIcon />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent className="whitespace-pre-wrap">
                {blockErrorMessage}
              </TooltipContent>
            </Tooltip>
          )}

          {props.mode === "review" &&
            (props.isCorrect ? (
              <CircleIcon className="text-primary stroke-4" />
            ) : (
              <XIcon className="text-destructive stroke-4" />
            ))}
        </div>
        <BlockQuestion
          question={props.question}
          mode={props.mode}
          onChangeQuestion={props.onUpdateQuestion}
        />
      </CardHeader>
      <CardContent className="px-4 md:px-6">
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
        ) : blockPropsTypeGuard("ranking", props) ? (
          <RankingBlockContent
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
      <CardFooter className="flex flex-col mt-2 px-4 md:px-6">
        <BlockSolution
          content={props.content}
          solution={props.answer?.solution ?? ""}
          mode={props.mode}
          isCorrect={props.isCorrect}
          onChangeSolution={props.onUpdateSolution}
          answer={props.answer}
          submit={props.submit}
        />
        {props.errorFeedback && (
          <p className="text-destructive text-xs whitespace-pre-wrap mt-4">
            {props.errorFeedback}
          </p>
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
    "onUpdateSolution",
    "onUpdateSubmitAnswer",
  ]);
  const nextProps = exclude(next, [
    "onToggleEditMode",
    "onUpdateContent",
    "onUpdateAnswer",
    "onUpdateQuestion",
    "onDeleteBlock",
    "onUpdateSolution",
    "onUpdateSubmitAnswer",
  ]);
  return equal(prevProps, nextProps);
});
