import { BlockContent } from "@service/solves/shared";

export function DefaultContent({
  content,
  question,
}: {
  content: BlockContent<"default">;
  question?: string;
}) {
  return <>{question}</>;
}
