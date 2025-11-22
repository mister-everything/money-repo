import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";

interface BlockQuestionProps {
  question?: string;
  mode?: "edit" | "solve";
  onChange?: (question: string) => void;
}

export function BlockQuestion({
  question,
  mode = "solve",
  onChange,
}: BlockQuestionProps) {
  const [repliation, setRepliation] = useState(question ?? "");

  const [isEditing, setIsEditing] = useState(false);

  const handleEditStart = useCallback(() => {
    if (mode === "solve") return;
    setIsEditing(true);
  }, [mode]);

  const handleEditStop = useCallback(() => {
    if (mode === "solve") return;
    if (!repliation) return;
    onChange?.(repliation ?? "");
    setIsEditing(false);
  }, [mode, onChange, repliation]);

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
