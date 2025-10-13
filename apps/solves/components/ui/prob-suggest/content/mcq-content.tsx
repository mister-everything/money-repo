import { BlockContent } from "@service/solves/shared";

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
