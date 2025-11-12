import { errorToString, toAny } from "@workspace/util";
import { toast } from "sonner";

function dateReviver(key: string, value: unknown) {
  if (typeof value === "string" && /\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return value as unknown;
}
export const fetcher = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  const res = await fetch(input, {
    ...init,
    redirect: "follow",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text, dateReviver) as unknown) : null;

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ?? res.statusText;

    throw new Error(message);
  }

  if (res.status >= 400) {
    const serverData = toAny(data);
    if (serverData.$ref === "solves-message" && serverData.message) {
      toast.error(serverData.message);
    }
    throw new Error(errorToString(data));
  }

  return data as T;
};
