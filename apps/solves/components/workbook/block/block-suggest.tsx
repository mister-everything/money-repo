"use client";
import { BlockAnswer, BlockContent, BlockType } from "@service/solves/shared";
import { equal, exclude, StateUpdate } from "@workspace/util";
import { memo, Ref } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { InDevelopment } from "@/components/ui/in-development";
import { cn } from "@/lib/utils";
import {
  DefaultBlockContent,
  McqMultipleBlockContent,
  McqSingleBlockContent,
  OXBlockContent,
  RankingBlockContent,
} from "./block-content";
import { BlockEditState } from "./block-edit-agent";
import { BlockQuestion } from "./block-question";
import { BlockSolution } from "./block-solution";
import { WorkBookComponentMode } from "./types";

export type BlockSuggestProps<T extends BlockType = BlockType> = {
  id: string;

  index: number;
  order: number;
  isPending?: boolean;
  type: T;

  mode: WorkBookComponentMode;
  question: string;
  content: BlockContent<T>;
  answer: BlockAnswer<T>;
  onUpdateContent?: (content: StateUpdate<BlockContent<T>>) => void;
  onUpdateAnswer?: (answer: StateUpdate<BlockAnswer<T>>) => void;
  onUpdateQuestion?: (question: string) => void;
  onUpdateSolution?: (solution: string) => void;
  onAcceptQuestion?: () => void;
  onRejectQuestion?: () => void;
  onAcceptContent?: () => void;
  onRejectContent?: () => void;
  onAcceptAnswer?: () => void;
  onRejectAnswer?: () => void;
  onAcceptSolution?: () => void;
  onRejectSolution?: () => void;

  className?: string;
  ref?: Ref<HTMLDivElement>;
  blockEditState: BlockEditState<T>;
};

const blockPropsTypeGuard = <T extends BlockType = BlockType>(
  type: T,
  props: BlockSuggestProps<any>,
): props is BlockSuggestProps<T> => {
  return props.type === type;
};

function PureBlockSuggest<T extends BlockType = BlockType>({
  className,
  ref,
  ...props
}: BlockSuggestProps<T>) {
  return (
    <Card className={cn("gap-2 shadow-none ", className)} ref={ref}>
      <CardHeader className="px-4 md:px-6">
        {props.blockEditState?.question && (
          <BlockQuestion
            question={props.blockEditState?.question}
            mode={props.mode}
            onChangeQuestion={props.onUpdateQuestion}
            isSuggest={true}
            onAcceptSuggest={props.onAcceptQuestion}
            onRejectSuggest={props.onRejectQuestion}
          />
        )}
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        {(props.blockEditState?.content || props.blockEditState?.answer) && (
          <>
            {blockPropsTypeGuard("default", props) ? (
              <DefaultBlockContent
                content={props.blockEditState.content ?? props.content}
                answer={props.blockEditState.answer ?? props.answer}
                mode={"edit"}
                onUpdateContent={props.onUpdateContent}
                onUpdateAnswer={props.onUpdateAnswer}
                isSuggest={true}
                onAcceptAnswer={props.onAcceptAnswer}
                onRejectAnswer={props.onRejectAnswer}
              />
            ) : blockPropsTypeGuard("mcq-multiple", props) ? (
              <McqMultipleBlockContent
                content={props.blockEditState.content ?? props.content}
                answer={props.blockEditState.answer ?? props.answer}
                mode={"edit"}
                onUpdateContent={props.onUpdateContent}
                onUpdateAnswer={props.onUpdateAnswer}
                isSuggest={true}
                onAcceptContent={props.onAcceptContent}
                onRejectContent={props.onRejectContent}
                onAcceptAnswer={props.onAcceptAnswer}
                onRejectAnswer={props.onRejectAnswer}
              />
            ) : blockPropsTypeGuard("mcq", props) ? (
              <McqSingleBlockContent
                content={props.blockEditState.content ?? props.content}
                answer={props.blockEditState.answer ?? props.answer}
                mode={"edit"}
                onUpdateContent={props.onUpdateContent}
                onUpdateAnswer={props.onUpdateAnswer}
                isSuggest={true}
                onAcceptContent={props.onAcceptContent}
                onRejectContent={props.onRejectContent}
                onAcceptAnswer={props.onAcceptAnswer}
                onRejectAnswer={props.onRejectAnswer}
              />
            ) : blockPropsTypeGuard("ox", props) ? (
              <OXBlockContent
                content={props.blockEditState.content ?? props.content}
                answer={props.blockEditState.answer ?? props.answer}
                mode={"edit"}
                onUpdateContent={props.onUpdateContent}
                onUpdateAnswer={props.onUpdateAnswer}
                isSuggest={true}
                onAcceptAnswer={props.onAcceptAnswer}
                onRejectAnswer={props.onRejectAnswer}
              />
            ) : blockPropsTypeGuard("ranking", props) ? (
              <RankingBlockContent
                content={props.blockEditState.content ?? props.content}
                answer={props.blockEditState.answer ?? props.answer}
                mode={"edit"}
                onUpdateContent={props.onUpdateContent}
                onUpdateAnswer={props.onUpdateAnswer}
                isSuggest={true}
                onAcceptContent={props.onAcceptContent}
                onRejectContent={props.onRejectContent}
                onAcceptAnswer={props.onAcceptAnswer}
                onRejectAnswer={props.onRejectAnswer}
              />
            ) : (
              <InDevelopment className="w-full text-sm h-48">
                아직 지원하지 않는 블럭 입니다.
              </InDevelopment>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col mt-2 px-4 md:px-6">
        {props.blockEditState?.solution && (
          <BlockSolution
            blockId={props.id}
            question={props.question}
            content={props.content}
            answer={props.answer}
            solution={props.blockEditState.solution!}
            mode={props.mode}
            isSuggest={true}
            onAcceptSuggest={props.onAcceptSolution}
            onRejectSuggest={props.onRejectSolution}
          />
        )}
      </CardFooter>
    </Card>
  );
}

PureBlockSuggest.displayName = "PureBlockSuggest";

export const BlockSuggest = memo(PureBlockSuggest, (prev, next) => {
  const prevProps = exclude(prev, [
    "onUpdateContent",
    "onUpdateAnswer",
    "onUpdateQuestion",
    "onUpdateSolution",
  ]);
  const nextProps = exclude(next, [
    "onUpdateContent",
    "onUpdateAnswer",
    "onUpdateQuestion",
    "onUpdateSolution",
  ]);
  return equal(prevProps, nextProps);
});
