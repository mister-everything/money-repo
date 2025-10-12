import type { ProbBlockWithoutAnswer } from "@service/solves/types";
import { ProbContent } from "./content/content";

export function ProbBlocks({ blocks }: { blocks: ProbBlockWithoutAnswer[] }) {
  return (
    <>
      {blocks.map((block) => (
        <ProbContent
          key={block.id}
          content={block.content}
          question={block.question}
        />
      ))}
    </>
  );
}
