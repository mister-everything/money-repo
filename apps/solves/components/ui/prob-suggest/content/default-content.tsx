import { BlockContent } from "@service/solves";

export function DefaultContent({
  content,
  question,
}: {
  content: BlockContent<"default">;
  question?: string;
}) {
  return <>{question}</>;
}
