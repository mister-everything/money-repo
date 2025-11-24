import { SOLVES_PROTOCOL_TAG } from "../const";

export type SafeSuccessResponse<T> = {
  data: T;
  success: true;
  $tag: typeof SOLVES_PROTOCOL_TAG;
};

export type SafeFailResponse = {
  message: string; // for toast
  success: false;
  error?: unknown;
  $tag: typeof SOLVES_PROTOCOL_TAG;
  fields: Record<string, string[] | undefined>;
};

export type SafeResponse<T> = SafeSuccessResponse<T> | SafeFailResponse;

export type SafeFunction<T, U> = (
  data: T,
) => Promise<SafeResponse<U>> | SafeResponse<U>;

export const isSafeResponse = <T = any>(
  response: any,
): response is SafeResponse<T> => {
  return Boolean(
    response &&
      typeof response === "object" &&
      "$tag" in response &&
      response.$tag === SOLVES_PROTOCOL_TAG,
  );
};

export const isSafeOk = <T = any>(
  response: any,
): response is SafeSuccessResponse<T> => {
  return isSafeResponse(response) && response.success === true;
};

export const isSafeFail = (response: any): response is SafeFailResponse => {
  return isSafeResponse(response) && response.success === false;
};

export const safeOk = <T>(data?: T): SafeSuccessResponse<T> => {
  if (isSafeResponse(data)) {
    return data as SafeSuccessResponse<T>;
  }
  return {
    data: data ?? (null as T),
    success: true,
    $tag: SOLVES_PROTOCOL_TAG,
  };
};

export const ok = safeOk; // alias for safeOk

export const safeFail = (
  message: string,
  fields?: Record<string, string[] | undefined>,
  error?: unknown,
): SafeFailResponse => {
  return {
    message,
    fields: fields || {},
    success: false,
    $tag: SOLVES_PROTOCOL_TAG,
    error,
  };
};

export const fail = safeFail; // alias for safeFail
