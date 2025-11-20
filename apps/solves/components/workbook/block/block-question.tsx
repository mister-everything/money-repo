import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { BlockDefaultProps } from "./types";

interface BlockQuestionProps {
  question: string;
  mode: BlockDefaultProps["mode"];
  onChangeQuestion?: (question: string) => void;
}

export function BlockQuestion({
  question,
  mode = "solve",
  onChangeQuestion,
}: BlockQuestionProps) {
  const [repliation, setRepliation] = useState(question);

  const editable = useMemo(() => mode == "edit", [mode]);

  const [isEditing, setIsEditing] = useState(false);

  const handleEditStart = useCallback(() => {
    if (!editable) return;
    setIsEditing(true);
  }, [editable]);

  const handleEditStop = useCallback(() => {
    if (!editable) return;
    const nextValue = repliation.trim();
    if (!nextValue) return;
    onChangeQuestion?.(nextValue);
    setIsEditing(false);
  }, [editable, onChangeQuestion, repliation]);

  if (isEditing) {
    return (
      <Input
        value={repliation}
        onChange={(e) => setRepliation(e.target.value)}
        onBlur={handleEditStop}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleEditStop();
          }
        }}
      />
    );
  }

  return (
    <p className="text-sm text-muted-foreground" onClick={handleEditStart}>
      {question}
    </p>
  );
}
