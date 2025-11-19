import { errorToString } from "@workspace/util";
import { isSafeFail, isSafeOk } from "./interface";

function dateReviver(_: string, value: unknown) {
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

  if (isSafeFail(data) || res.status >= 400 || !res.ok) {
    throw new Error(errorToString(data) ?? res.statusText);
  }

  if (isSafeOk(data)) {
    return data.data as T;
  }

  return data as T;
};
