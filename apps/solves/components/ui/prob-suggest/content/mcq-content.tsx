import type { BlockContent } from "@service/solves/types";

export function McqContent({
  content,
  question,
}: {
  content: BlockContent<"mcq">;
  question?: string;
}) {
  return (
    <>
      {question}
      {content.options.map((option) => (
        <div key={option.id}>
          {option.type === "text" ? option.text : option.url}
        </div>
      ))}
    </>
  );
}
