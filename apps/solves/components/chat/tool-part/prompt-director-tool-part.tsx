import { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { getToolName, ToolUIPart } from "ai";
import { useEffect, useState } from "react";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { promptDirectorInputSchema } from "@/lib/ai/tools/workbook/prompt-director-tools";

type ToolOutput = {
  // type 바꿔
  question: string;
  answers: string[];
}[];

export function PromptDirectorToolPart({
  part,
  addToolOutput,
}: {
  part: ToolUIPart;
  addToolOutput?: UseChatHelpers<UIMessage>["addToolOutput"];
}) {
  const input = part.input as z.infer<typeof promptDirectorInputSchema>;

  const [selected, setSelected] = useState<ToolOutput>([]);

  const handleClick = () => {
    addToolOutput?.({
      toolCallId: part.toolCallId,
      tool: getToolName(part),
      state: "output-available",
      output: selected,
    });
  };

  useEffect(() => {
    if (part.state == "input-available") {
      const initial: ToolOutput = input.questions.map((v) => {
        return {
          question: v.question,
          answers: [],
        };
      });
      setSelected(initial);
    }
  }, [part.state]);

  return (
    <div className="p-2">
      {input?.questions?.map((v, i) => {
        return (
          <div className="flex flex-col" key={i}>
            <p className="">{v.question}</p>
            {v.options?.map((vv, ii) => {
              return (
                <div key={ii}>
                  <Checkbox
                    onCheckedChange={(e) => {
                      setSelected((prev) =>
                        prev.map((p, j) => {
                          if (j != i) return p;

                          return {
                            ...p,
                            answers: e
                              ? [...p.answers, vv]
                              : p.answers?.filter((v) => v != vv),
                          };
                        }),
                      );
                    }}
                    checked={selected[i]?.answers?.includes(vv)}
                  />
                  <span className="ml-4">{vv}</span>;
                </div>
              );
            })}
          </div>
        );
      })}
      <pre>{JSON.stringify(selected, null, 2)}</pre>
      <Button disabled={part.state != "input-available"} onClick={handleClick}>
        전송
      </Button>
    </div>
  );
}
