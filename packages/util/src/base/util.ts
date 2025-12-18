export const createIncrement =
  (i = 0) =>
  () =>
    i++;

export const noop = () => {};

export const wait = (delay = 0) =>
  new Promise<void>((resolve) => setTimeout(resolve, delay));

export const randomRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

export const isString = (value: any): value is string =>
  typeof value === "string";

export const isFunction = <
  T extends (...args: any[]) => any = (...args: any[]) => any,
>(
  v: unknown,
): v is T => typeof v === "function";

export const isObject = (value: any): value is Record<string, any> =>
  Object(value) === value;

export const isNull = (value: any): value is null | undefined => value == null;

export const isPromiseLike = (x: unknown): x is PromiseLike<unknown> =>
  isFunction((x as any)?.then);

export const isJson = (value: any): value is Record<string, any> => {
  try {
    if (typeof value === "string") {
      const str = value.trim();
      JSON.parse(str);
      return true;
    } else if (isObject(value)) {
      return true;
    }
    return false;
  } catch (_e) {
    return false;
  }
};

export const createDebounce = () => {
  let timeout: ReturnType<typeof setTimeout>;

  const debounce = (func: (...args: any[]) => any, waitFor = 200) => {
    clearTimeout(timeout!);
    timeout = setTimeout(() => func(), waitFor);
    return timeout;
  };

  debounce.clear = () => {
    clearTimeout(timeout!);
  };
  return debounce;
};

export const createThrottle = () => {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const throttle = (func: (...args: any[]) => any, waitFor = 200) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= waitFor) {
      lastCall = now;
      func();
    } else {
      // Schedule the next call if not already scheduled
      if (!timeout) {
        const remainingTime = waitFor - timeSinceLastCall;
        timeout = setTimeout(() => {
          lastCall = Date.now();
          func();
          timeout = null;
        }, remainingTime);
      }
    }
  };

  throttle.clear = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastCall = 0;
  };

  return throttle;
};

export const groupBy = <T>(arr: T[], getter: keyof T | ((item: T) => string)) =>
  arr.reduce(
    (prev, item) => {
      const key: string =
        getter instanceof Function ? getter(item) : (item[getter] as string);

      if (!prev[key]) prev[key] = [];
      prev[key].push(item);
      return prev;
    },
    {} as Record<string, T[]>,
  );

export const PromiseChain = () => {
  let promise: Promise<any> = Promise.resolve();
  return <T>(asyncFunction: () => Promise<T>): Promise<T> => {
    const resultPromise = promise.then(() => asyncFunction());
    promise = resultPromise;
    return resultPromise;
  };
};

export class Locker {
  private promise = Promise.resolve();
  private resolve?: () => void;

  get isLocked() {
    return !!this.resolve;
  }

  lock() {
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  unlock() {
    if (!this.isLocked) return;
    this.resolve?.();
    this.resolve = undefined;
  }
  async wait() {
    await this.promise;
  }
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function toAny<T>(value: T): any {
  return value;
}

export function errorToString(error: unknown) {
  if (error == null) {
    return "unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}

export function objectFlow<T extends Record<string, any>>(obj: T) {
  return {
    map: <R>(
      fn: (value: T[keyof T], key: keyof T) => R,
    ): Record<keyof T, R> => {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, fn(value, key)]),
      ) as Record<keyof T, R>;
    },
    filter: (
      fn: (value: T[keyof T], key: keyof T) => boolean,
    ): Record<keyof T, T[keyof T]> => {
      return Object.fromEntries(
        Object.entries(obj).filter(([key, value]) => fn(value, key)),
      ) as Record<keyof T, T[keyof T]>;
    },

    forEach: (fn: (value: T[keyof T], key: keyof T) => void): void => {
      Object.entries(obj).forEach(([key, value]) => fn(value, key));
    },
    some: (fn: (value: T[keyof T], key: keyof T) => any): boolean => {
      return Object.entries(obj).some(([key, value]) => fn(value, key));
    },
    every: (fn: (value: T[keyof T], key: keyof T) => any): boolean => {
      return Object.entries(obj).every(([key, value]) => fn(value, key));
    },
    find(fn: (value: T[keyof T], key: keyof T) => any): T | undefined {
      return Object.entries(obj).find(([key, value]) => fn(value, key))?.[1];
    },
  };
}

export function capitalizeFirstLetter(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export async function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function exclude<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K)),
  ) as Omit<T, K>;
}

export const createEmitter = () => {
  const listeners = new Set<(value: string) => void>();
  return {
    on: (listener: (value: string) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    off: (listener: (value: string) => void) => {
      listeners.delete(listener);
    },
    emit: (value: string) => {
      listeners.forEach((listener) => listener(value));
    },
  };
};

export function deduplicateByKey<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set<T[keyof T]>();
  return arr.filter((item) => {
    const keyValue = item[key];
    if (seen.has(keyValue)) {
      return false;
    } else {
      seen.add(keyValue);
      return true;
    }
  });
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout"));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function deduplicate<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function arrayToObject<T>(
  arr: T[],
  getter: (item: T) => string,
): Record<string, T> {
  return arr.reduce(
    (acc, item) => {
      acc[getter(item)] = item;
      return acc;
    },
    {} as Record<string, T>,
  );
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 짧은 고유 ID 생성기
 *
 * @param options.prefix - ID 앞에 붙일 접두사
 * @param options.length - 랜덤 부분 길이 (기본값: 4)
 * @param options.existingIds - 중복 방지를 위한 기존 ID 목록
 *
 * @example
 * const gen = createIdGenerator({ prefix: "opt-", length: 4 });
 * gen(); // "opt-aB3_"
 * gen(); // "opt-Xk9-"
 */
export const createIdGenerator = (options?: {
  prefix?: string;
  length?: number;
  existingIds?: string[];
}) => {
  const { prefix = "", length = 4, existingIds = [] } = options ?? {};
  const usedIds = new Set<string>(existingIds);

  // 영문 대소문자, 숫자, 특수문자(-, _)
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";

  const generate = (): string => {
    let id: string;
    let attempts = 0;
    const maxAttempts = 1000;

    do {
      let randomPart = "";
      for (let i = 0; i < length; i++) {
        randomPart += chars[Math.floor(Math.random() * chars.length)];
      }
      id = prefix + randomPart;
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique ID after maximum attempts");
      }
    } while (usedIds.has(id));

    usedIds.add(id);
    return id;
  };

  return generate;
};
