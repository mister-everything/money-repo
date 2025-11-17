import { isFunction, isNull } from "@workspace/util";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import { isSafeFail, SafeFailResponse, SafeFunction } from "./interface";

export type SafeActionOptions<U> = {
  onSuccess?: (response: U) => void;
  onError?: (error: SafeFailResponse) => void;
  successMessage?: string | ((response: U) => string);
  failMessage?: string | ((error: SafeFailResponse) => string);
};

export function useSafeAction<T, U>(
  serverAction: SafeFunction<T, U>,
  options?: SafeActionOptions<U>,
) {
  const [isPending, startTransition] = useTransition();

  const action = useCallback(
    (input: T) => {
      startTransition(() => {
        void (async () => {
          try {
            const result = await serverAction(input);
            if (isSafeFail(result)) throw result;

            const data = result.data;

            options?.onSuccess?.(data);

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
      options?.onSuccess,
      options?.onError,
      options?.successMessage,
      options?.failMessage,
    ],
  );

  return [action, isPending] as const;
}
