import type { BlockContent } from "@service/solves/types";

export function DefaultContent({
  content,
  question,
}: {
  content: BlockContent<"default">;
  question?: string;
}) {
  return <>{question}</>;
}
