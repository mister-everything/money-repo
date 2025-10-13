import { BlockContent, isContent } from "@service/solves/shared";
import { DefaultContent } from "./default-content";
import { McqContent } from "./mcq-content";

export function ProbContent({
  content,
  question,
}: {
  content: BlockContent;
  question?: string;
}) {
  if (isContent.default(content)) {
    return <DefaultContent content={content} question={question} />;
  }

  if (isContent.mcq(content)) {
    return <McqContent content={content} question={question} />;
  }

  return <>{question}</>;
}
