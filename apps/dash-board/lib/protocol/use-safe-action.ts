import { isFunction, isNull } from "@workspace/util";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  isSafeFail,
  SafeFailResponse,
  SafeFunction,
  SafeResponse,
} from "./interface";

export type SafeActionOptions<T, U> = {
  onSuccess?: (response: U) => void;
  onError?: (error: SafeFailResponse) => void;
  onFinish?: (result: SafeResponse<U>) => void;
  onBefore?: (input: T) => Promise<T> | T;
  successMessage?: string | ((response: U) => string);
  failMessage?: string | ((error: SafeFailResponse) => string);
};

export function useSafeAction<T, U>(
  serverAction: SafeFunction<T, U>,
  options?: SafeActionOptions<T, U>,
) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SafeResponse<U> | null>(null);

  const action = useCallback(
    (input: T | undefined = undefined) => {
      if (isPending) return;
      setResult(null);
      startTransition(() => {
        void (async () => {
          try {
            const onBefore = options?.onBefore ?? (() => input);
            const _input = await onBefore(input as T);
            const result = await serverAction(_input as T);
            if (isSafeFail(result)) throw result;

            const data = result.data;
            setResult(result);

            options?.onSuccess?.(data);
            options?.onFinish?.(result);

            const successMessage = options?.successMessage;
            if (!isNull(successMessage)) {
              if (isFunction(successMessage)) {
                toast.success(successMessage(data));
              } else {
                toast.success(successMessage);
              }
            }
          } catch (error: any) {
            if (!isSafeFail(error)) throw error;
            options?.onError?.(error);
            options?.onFinish?.(error);
            setResult(error);
            const failMessage = options?.failMessage;
            if (!isNull(failMessage)) {
              if (isFunction(failMessage)) {
                toast.error(failMessage(error));
              } else {
                toast.error(failMessage);
              }
            }
          }
        })();
      });
    },
    [
      serverAction,
      isPending,
      options?.onSuccess,
      options?.onError,
      options?.successMessage,
      options?.failMessage,
    ],
  );

  return [result, action, isPending] as const;
}
