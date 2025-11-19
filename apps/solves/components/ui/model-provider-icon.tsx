import { BlendIcon } from "lucide-react";
import { ClaudeIcon, GeminiIcon, GrokIcon, OpenAIIcon } from "./custom-icon";

export function ModelProviderIcon({
  provider,
  className,
}: {
  provider: string;
  className?: string;
}) {
  return provider === "openai" ? (
    <OpenAIIcon className={className} />
  ) : provider === "xai" ? (
    <GrokIcon className={className} />
  ) : provider === "anthropic" ? (
    <ClaudeIcon className={className} />
  ) : provider === "google" ? (
    <GeminiIcon className={className} />
  ) : (
    <BlendIcon className={className} />
  );
}
