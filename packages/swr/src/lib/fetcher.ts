export function dateReviver(key: string, value: unknown) {
  if (typeof value === "string" && /\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return value as unknown;
}

export async function fetchJSON<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
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

  if (
    data &&
    typeof data === "object" &&
    "success" in (data as any) &&
    (data as any).success === false
  ) {
    throw new Error((data as any).error ?? "Unknown error");
  }

  return data as T;
}
