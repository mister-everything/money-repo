import { CheckIcon, CopyIcon } from "lucide-react";
import { useCopy } from "@/hooks/use-copy";
import { Button } from "./button";

export function CopyButton({
  text,
  onCopied,
}: {
  text: string;
  onCopied?: () => void;
}) {
  const { copy, copied } = useCopy();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        copy(text);
        onCopied?.();
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon className="size-3!" />}
    </Button>
  );
}
